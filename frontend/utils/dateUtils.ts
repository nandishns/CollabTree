export const getNextAvailableDisplay = (schedules: Array<{ slots: Array<{ status: string; time: string }> }>) => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const nextSlot = schedules.find(schedule => 
    schedule.slots.some(slot => 
      slot.status.toUpperCase() === "AVAILABLE" && slot.time >= currentTime
    ))?.slots;

  if (!nextSlot) return "No availability";
  
  const time = nextSlot[0].time;
  const [hours, minutes] = time.split(':');
  const slotTime = new Date(now.setHours(Number(hours), Number(minutes)));

  if (slotTime.getTime() < now.getTime()) {
    return "Tomorrow " + time;
  }
  return slotTime.getTime() - now.getTime() < 3600000 ? 
    "Now" : 
    "Today " + time;
}; 