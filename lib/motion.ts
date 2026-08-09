// Shared spring preset for overlay/panel entrances (Modal, Popover,
// CollapsibleSection) so every "appear near where you clicked" animation
// feels like one deliberate motion language instead of three close-but-not-
// quite-matching hand-typed values.
export const overlaySpring = { type: 'spring' as const, stiffness: 300, damping: 30 };
