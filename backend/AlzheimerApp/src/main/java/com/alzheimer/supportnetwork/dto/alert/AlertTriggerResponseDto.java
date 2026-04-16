package com.alzheimer.supportnetwork.dto.alert;

import com.alzheimer.supportnetwork.dto.dispatch.DispatchAssigneeDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanDto;
import com.alzheimer.supportnetwork.dto.mission.MissionResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertTriggerResponseDto {

    private MissionResponseDto mission;

    /** First assignee from dispatch plan step 1 (same member assigned to the mission). */
    private DispatchAssigneeDto selectedIntervenant;

    /** Plan used to pick the assignee (same logical plan as stored for the mission after dispatch). */
    private DispatchPlanDto dispatchPlan;
}
