/**
 * Deterministic rule-based matching function.
 * Matches supply (harvestListings) against buyer demand (buyerRequirements).
 * Returns a score out of 100%.
 */
export const calculateMatchScore = (supply, requirement) => {
  let score = 0;
  let maxScore = 100;
  let matchReasons = [];

  // 1. Crop Match (Critical - 50 points)
  if (supply.crop === requirement.crop) {
    score += 50;
    matchReasons.push('Exact crop match');
  } else {
    return { score: 0, isMatch: false, reasons: ['Crop mismatch'] };
  }

  // 2. Quantity Match (25 points)
  // Check if supply can fulfill at least 50% of requirement, or if requirement is smaller than supply
  const supplyQty = parseFloat(supply.quantity);
  const reqQty = parseFloat(requirement.quantity);
  
  if (!isNaN(supplyQty) && !isNaN(reqQty)) {
    if (supplyQty >= reqQty) {
      score += 25;
      matchReasons.push('Can fulfill entire quantity');
    } else if (supplyQty >= (reqQty * 0.5)) {
      score += 15;
      matchReasons.push('Can fulfill partial quantity (>50%)');
    } else {
      score += 5;
      matchReasons.push('Can fulfill small partial quantity (<50%)');
    }
  }

  // 3. Date Match (25 points)
  // Check if expected harvest date is before or around the required date
  if (supply.expectedDate && requirement.requiredDate) {
    const supplyDate = new Date(supply.expectedDate);
    const reqDate = new Date(requirement.requiredDate);
    
    // If supply is ready before or exactly when required
    if (supplyDate <= reqDate) {
      score += 25;
      matchReasons.push('Available before required date');
    } else {
      const diffTime = Math.abs(supplyDate - reqDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        score += 15;
        matchReasons.push('Available within 7 days of required date');
      } else {
        score += 0;
        matchReasons.push('Available much later than required');
      }
    }
  }

  return {
    score,
    scoreDisplay: `${score}%`,
    isMatch: score >= 60, // Minimum threshold to be considered a viable match
    reasons: matchReasons
  };
};
