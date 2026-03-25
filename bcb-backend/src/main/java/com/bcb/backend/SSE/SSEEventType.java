package com.bcb.backend.SSE;

public final class SSEEventType {

    private SSEEventType() {}

    public static final String RESERVATION_CREATED = "RESERVATION_CREATED";
    public static final String TEMPORARY_RECRUITMENT_POST_CREATED = "TEMPORARY_RECRUITMENT_POST_CREATED"; 
    public static final String BRANCH_UPDATE = "BRANCH_UPDATE";
    public static final String PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";
    public static final String PAYMENT_REJECTED = "PAYMENT_REJECTED";

}
