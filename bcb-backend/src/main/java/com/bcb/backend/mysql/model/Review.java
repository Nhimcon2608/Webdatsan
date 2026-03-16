package com.bcb.backend.mysql.model;

import java.util.Date;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
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
@Table(name = "review")
public class Review {
    
    @Id
    @Column(name = "id")
    private String id;
    
    @Column(name = "create_at")
    @CreationTimestamp
    private Date createAt;

    @Column(name = "rating_level")
    private short raringLevel;

    @Lob
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "player_id") 
    private Player player;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;
}
