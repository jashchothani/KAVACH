/// User role options for sign-up.
enum UserRole {
  admin('Admin'),
  securityAnalyst('Security Analyst'),
  auditor('Auditor');

  const UserRole(this.displayName);

  /// Human-readable display name for the role.
  final String displayName;
}
