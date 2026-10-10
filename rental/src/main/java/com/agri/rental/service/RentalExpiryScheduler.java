package com.agri.rental.service;

import com.agri.rental.domain.Booking;
import com.agri.rental.repository.BookingRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class RentalExpiryScheduler {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    // =========================================================
    // OVERDUE CHARGE CONFIGURATION
    // =========================================================

    // First 1 hour after rental expiry is FREE
    private static final long GRACE_PERIOD_HOURS = 1;


    public RentalExpiryScheduler(
            BookingRepository bookingRepository,
            NotificationService notificationService) {

        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }


    // =========================================================
    // CHECK RENTAL EXPIRY EVERY 1 MINUTE
    // =========================================================

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkRentalExpiry() {

        LocalDateTime now = LocalDateTime.now();


        // =====================================================
        // FIND ACTIVE BOOKINGS WHOSE RENTAL TIME HAS ENDED
        // =====================================================

        List<Booking> expiredBookings =
                bookingRepository
                        .findByStatusAndEndDateTimeLessThanEqual(
                                "ACTIVE",
                                now
                        );


        for (Booking booking : expiredBookings) {

            System.out.println(
                    "Rental expired for Booking ID: "
                            + booking.getId()
            );


            // =================================================
            // ACTIVE → OVERDUE
            // =================================================

            booking.setStatus("OVERDUE");

            /*
             * IMPORTANT:
             *
             * Store the ACTUAL rental expiry time.
             *
             * Do NOT store 'now' here because the scheduler
             * may detect the expiry a few seconds/minutes later.
             */

            booking.setOverdueSince(
                    booking.getEndDateTime()
            );

            // Start with zero charges.
            booking.setExtraCharges(0.0);

            bookingRepository.save(booking);


            // =================================================
            // CREATE EXPIRY NOTIFICATION
            // =================================================

            try {

                notificationService
                        .createRentalExpiryNotification(
                                booking.getId()
                        );

                System.out.println(
                        "Expiry notification created for Booking ID: "
                                + booking.getId()
                );

            } catch (Exception e) {

                System.out.println(
                        "Failed to create notification for Booking ID: "
                                + booking.getId()
                                + " : "
                                + e.getMessage()
                );
            }
        }


        // =====================================================
        // UPDATE CHARGES FOR ALL OVERDUE BOOKINGS
        // =====================================================

        updateOverdueCharges(now);
    }


    // =========================================================
    // CALCULATE OVERDUE CHARGES
    // =========================================================

    private void updateOverdueCharges(
            LocalDateTime now) {

        List<Booking> overdueBookings =
                bookingRepository.findByStatus("OVERDUE");


        for (Booking booking : overdueBookings) {

            // =================================================
            // SAFETY CHECK
            // =================================================

            if (booking.getOverdueSince() == null) {

                System.out.println(
                        "Skipping Booking ID "
                                + booking.getId()
                                + " because overdue time is missing."
                );

                continue;
            }


            // =================================================
            // SAFETY CHECK - EQUIPMENT
            // =================================================

            if (booking.getEquipment() == null) {

                System.out.println(
                        "Skipping Booking ID "
                                + booking.getId()
                                + " because equipment is missing."
                );

                continue;
            }


            // =================================================
            // GET PRICE PER DAY
            // =================================================

            double pricePerDay =
                    booking.getEquipment()
                            .getPricePerDay();


            // =================================================
            // GRACE PERIOD
            // =================================================

            LocalDateTime chargeStartTime =
                    booking.getOverdueSince()
                            .plusHours(GRACE_PERIOD_HOURS);


            // =================================================
            // GRACE PERIOD NOT COMPLETED
            // =================================================

            if (now.isBefore(chargeStartTime)) {

                booking.setExtraCharges(0.0);

                bookingRepository.save(booking);

                System.out.println(
                        "Booking ID: "
                                + booking.getId()
                                + " | Grace period active | Charge: ₹0"
                );

                continue;
            }


            // =================================================
            // CALCULATE OVERDUE MINUTES
            // =================================================

            long overdueMinutes =
                    java.time.Duration.between(
                            chargeStartTime,
                            now
                    ).toMinutes();


            // =================================================
            // CONVERT OVERDUE TIME TO DAYS
            // =================================================
            //
            // Any partial day counts as one complete day.
            //
            // 1 minute       → 1 day
            // 12 hours       → 1 day
            // 24 hours       → 1 day
            // 24 hours + 1m  → 2 days
            // 48 hours       → 2 days
            //
            // =================================================

            long overdueDays =
                    (long) Math.ceil(
                            overdueMinutes / (24.0 * 60.0)
                    );


            // =================================================
            // CALCULATE EXTRA CHARGE
            // =================================================

            double extraCharges =
                    overdueDays * pricePerDay;


            // =================================================
            // ROUND TO 2 DECIMAL PLACES
            // =================================================

            extraCharges =
                    Math.round(
                            extraCharges * 100.0
                    ) / 100.0;


            // =================================================
            // SAVE CHARGE
            // =================================================

            booking.setExtraCharges(
                    extraCharges
            );

            bookingRepository.save(booking);


            // =================================================
            // LOG
            // =================================================

            System.out.println(
                    "Booking ID: "
                            + booking.getId()
                            + " | Overdue Days: "
                            + overdueDays
                            + " | Price Per Day: ₹"
                            + pricePerDay
                            + " | Overdue Charge: ₹"
                            + extraCharges
            );
        }
    }
}