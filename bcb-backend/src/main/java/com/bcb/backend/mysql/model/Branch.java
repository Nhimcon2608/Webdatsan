package com.bcb.backend.mysql.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "branch")
public class Branch {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "branch_name")
    private String branchName;

    @Column(name = "email")
    private String email;

    @Column(name = "address")
    private String address;

    @Column(name = "bank_name")
    private String bankName;
    
    @Column(name = "bank_number")
    private String bankNumber;

    @Lob
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_cooperated")
    private boolean isCooperated;
    /*
     * đang hợp tác: true
     * ngưng hơp tác: false
     */

    @OneToOne
    @JoinColumn(name = "account_id")
    private Account account;

    @OneToOne
    @JoinColumn(name = "partnership_request_id")
    private PartnershipRequest partnershipRequest;

    @OneToMany(mappedBy = "branch")
    @Builder.Default
    private List<Price> price = new ArrayList<>();

    @OneToMany(mappedBy = "branch")
    @Builder.Default
    private List<BadmintonCourt> badmintonCourts = new ArrayList<>();

    @OneToMany(mappedBy = "branch")
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "branch")
    @Builder.Default
    private List<Voucher> vouchers = new ArrayList<>();

    @OneToMany(mappedBy = "branch")
    @Builder.Default
    private List<Reservation> reservations = new ArrayList<>();
}
