package com.agri.rental.controller;

import com.agri.rental.domain.Booking;
import com.agri.rental.repository.BookingRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings/pay")
public class BookingPaymentController {

    @Value("${razorpay.key.id}")
    private String razorpayKey;

    @Value("${razorpay.key.secret}")
    private String razorpaySecret;

    private final BookingRepository bookingRepository;

    public BookingPaymentController(
            BookingRepository bookingRepository) {

        this.bookingRepository = bookingRepository;
    }


    // =========================================================
    // 1️⃣ CREATE PAYMENT ORDER
    // =========================================================

    // POST
    // http://localhost:8080/api/bookings/pay/create/{bookingId}/

    @PostMapping("/create/{bookingId}/")
    public ResponseEntity<Map<String, Object>> createPayment(
            @PathVariable Long bookingId
    ) throws Exception {

        Booking booking =
                bookingRepository.findById(bookingId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Booking not found"
                                )
                        );


        RazorpayClient client =
                new RazorpayClient(
                        razorpayKey,
                        razorpaySecret
                );


        JSONObject orderRequest =
                new JSONObject();

        orderRequest.put(
                "amount",
                booking.getTotalAmount() * 100
        );

        orderRequest.put(
                "currency",
                "INR"
        );

        orderRequest.put(
                "receipt",
                "booking_" + bookingId
        );


        Order order =
                client.orders.create(orderRequest);


        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "razorpay_key",
                razorpayKey
        );

        response.put(
                "order_id",
                order.get("id")
        );

        response.put(
                "amount",
                order.get("amount")
        );

        response.put(
                "currency",
                "INR"
        );


        return ResponseEntity.ok(response);
    }


    // =========================================================
    // 2️⃣ VERIFY PAYMENT
    // =========================================================

    // POST
    // http://localhost:8080/api/bookings/pay/verify/{bookingId}/

    @PostMapping("/verify/{bookingId}/")
    public ResponseEntity<String> verifyPayment(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> payload
    ) {

        try {

            // -------------------------------------------------
            // Get Razorpay payment details
            // -------------------------------------------------

            String paymentId =
                    payload.get("razorpay_payment_id");

            String orderId =
                    payload.get("razorpay_order_id");

            String signature =
                    payload.get("razorpay_signature");


            // -------------------------------------------------
            // Basic validation
            // -------------------------------------------------

            if (paymentId == null ||
                    orderId == null ||
                    signature == null) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Payment details are missing"
                        );
            }


            // -------------------------------------------------
            // Create signature verification object
            // -------------------------------------------------

            JSONObject options =
                    new JSONObject();

            options.put(
                    "razorpay_payment_id",
                    paymentId
            );

            options.put(
                    "razorpay_order_id",
                    orderId
            );

            options.put(
                    "razorpay_signature",
                    signature
            );


            // -------------------------------------------------
            // Verify Razorpay signature
            // -------------------------------------------------

            boolean valid =
                    Utils.verifyPaymentSignature(
                            options,
                            razorpaySecret
                    );


            if (!valid) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Invalid signature"
                        );
            }


            // -------------------------------------------------
            // Find booking
            // -------------------------------------------------

            Booking booking =
                    bookingRepository.findById(bookingId)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "Booking not found"
                                    )
                            );


            // -------------------------------------------------
            // Payment verified successfully
            // -------------------------------------------------

            booking.setStatus("PAID");


            // -------------------------------------------------
            // SAVE RAZORPAY PAYMENT ID
            // -------------------------------------------------

            booking.setRazorpayPaymentId(
                    paymentId
            );


            bookingRepository.save(booking);


            return ResponseEntity
                    .ok(
                            "Payment successful"
                    );


        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(500)
                    .body(
                            "Payment verification failed: "
                                    + e.getMessage()
                    );
        }
    }
}