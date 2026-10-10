package com.agri.rental.dto;

public class BookingRequestDTO {


        private int userId;
        private int equipmentId;
        private int days;

        public BookingRequestDTO() {
        }

        public int getUserId() {
            return userId;
        }

        public void setUserId(int userId) {
            this.userId = userId;
        }

        public int getEquipmentId() {
            return equipmentId;
        }

        public void setEquipmentId(int equipmentId) {
            this.equipmentId = equipmentId;
        }

        public int getDays() {
            return days;
        }

        public void setDays(int days) {
            this.days = days;
        }
    }


