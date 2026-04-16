package com.alzheimer.supportnetwork.entity;

import jakarta.persistence.*;
import lombok.*;

/** Email format is validated on {@link com.alzheimer.supportnetwork.dto.member.SupportMemberDto}, not here (nullable in DB). */
@Entity
@Table(name = "support_member")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String phone;
    /** Optional email for notifications (mission assigned, etc.). */
    @Column(name = "email", nullable = true, length = 320)
    private String email;
    private String type;
    private String locationZone;
    private String notes;

    /** Optional WGS84 latitude for distance-based ranking. */
    private Double latitude;

    /** Optional WGS84 longitude for distance-based ranking. */
    private Double longitude;

    /** Rolling mean of intervention report ratings (1–5). Starts at 0 until first report. */
    @Column(nullable = false)
    private double averageRating = 0.0;

    /** Count of intervention reports contributing to {@link #averageRating}. */
    @Column(nullable = false)
    private int totalRatings = 0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLocationZone() { return locationZone; }
    public void setLocationZone(String locationZone) { this.locationZone = locationZone; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public int getTotalRatings() { return totalRatings; }
    public void setTotalRatings(int totalRatings) { this.totalRatings = totalRatings; }
}
