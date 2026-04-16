package com.alzheimer.supportnetwork.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopIntervenantDto {

    private Long memberId;
    private String name;
    /** Average rating from intervention reports (0 if none). */
    private double rating;
}
