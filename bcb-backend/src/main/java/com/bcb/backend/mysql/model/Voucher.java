package com.bcb.backend.mysql.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "voucher")
public class Voucher {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "create_at")
    @CreationTimestamp
    private Date createAt;

    @Column(name = "discount_rate")
    private double discountRate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "event")
    private String event;

    @Column(name = "is_available")
    private boolean isAvailable;
    /*
     * khả dụng: 1
     * không khả dụng: 0
     */

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @OneToMany(mappedBy = "voucher")
    @Builder.Default
    private List<Reservation> reservation = new ArrayList<>();

}
