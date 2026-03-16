package com.bcb.backend.mysql.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
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
@Table(name = "temporary_recruitment")
public class TemporaryRecruitment {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "create_at")
    @CreationTimestamp
    private Date createAt;

    @Column(name = "quantity")
    private short quantity;

    @Column(name = "is_available")
    private boolean isAvailable;
    /*
     * đang tuyển: true
     * ngưng tuyển: false
     */

    @Lob
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @OneToMany(mappedBy = "temporaryRecruitment")
    @Builder.Default
    private List<TemporaryRegistration> temporaryRegistrations = new ArrayList<>();

    @OneToMany(mappedBy = "temporaryRecruitment")
    @Builder.Default
    private List<TemporaryRegistration> temporaryRecruitmentSaved = new ArrayList<>();
}
