const trips = (await getTripsWithPriority())
  .sort((a, b) => b.priority_score - a.priority_score)
  .slice(0, 10)
