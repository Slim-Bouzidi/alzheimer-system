package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.DispatchStepExecution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DispatchStepExecutionRepository extends JpaRepository<DispatchStepExecution, Long> {

    List<DispatchStepExecution> findByDispatch_IdOrderByStepNumberAscIdAsc(Long dispatchId);
}
