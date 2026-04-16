package com.alzheimer.supportnetwork.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity(name = "SupportNetworkPatient")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {

    @Id
    private Long id;

    private String fullName;

    private String zone;

    /** Optional WGS84 latitude for distance-based ranking. */
    private Double latitude;

    /** Optional WGS84 longitude for distance-based ranking. */
    private Double longitude;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
