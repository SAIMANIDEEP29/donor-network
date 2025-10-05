export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export function getCompatibleBloodGroups(requestedGroup: BloodGroup): BloodGroup[] {
  const compatibility: Record<BloodGroup, BloodGroup[]> = {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
  };
  
  return compatibility[requestedGroup];
}

export function canDonate(donorBloodGroup: BloodGroup, recipientBloodGroup: BloodGroup): boolean {
  const compatibleGroups = getCompatibleBloodGroups(recipientBloodGroup);
  return compatibleGroups.includes(donorBloodGroup);
}

export function getDonationCooldownDays(): number {
  return 90;
}

export function getDaysUntilEligible(lastDonationDate: string | null): number | null {
  if (!lastDonationDate) return null;
  
  const lastDonation = new Date(lastDonationDate);
  const cooldownDays = getDonationCooldownDays();
  const nextEligibleDate = new Date(lastDonation);
  nextEligibleDate.setDate(nextEligibleDate.getDate() + cooldownDays);
  
  const today = new Date();
  const daysRemaining = Math.ceil((nextEligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysRemaining > 0 ? daysRemaining : 0;
}