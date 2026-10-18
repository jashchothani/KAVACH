/// User role options and mode resolution for KAVACH Flutter application.
enum UserRole {
  user('KAVACH User Mode', 'layman_user'),
  socAnalyst('KAVACH SOC Analyst Mode', 'soc_analyst'),
  admin('KAVACH Admin Mode', 'admin');

  const UserRole(this.displayName, this.apiValue);

  /// Human-readable display name for the role.
  final String displayName;

  /// API value representing the role.
  final String apiValue;

  /// Whether the role possesses SOC Analyst privileges.
  bool get isSocAnalyst => this == UserRole.socAnalyst;

  /// Whether the role corresponds to standard User Mode.
  bool get isUserMode => this == UserRole.user;

  /// Whether the role is an administrator.
  bool get isAdmin => this == UserRole.admin;

  /// Parse role string returned from backend session payload.
  static UserRole fromString(String? role) {
    if (role == null) return UserRole.user;
    final r = role.toLowerCase().trim();
    // SOC Analyst is strictly distinct and cannot have admin permissions
    if (r.contains('analyst') ||
        r == 'soc' ||
        r.startsWith('soc_') ||
        r.contains('responder') ||
        r.contains('operator') ||
        r.contains('security_manager') ||
        r.contains('soc_analyst')) {
      return UserRole.socAnalyst;
    }
    if (r.contains('super_admin') ||
        r == 'admin' ||
        r == 'administrator' ||
        r.contains('secops_admin') ||
        r.contains('owner')) {
      return UserRole.admin;
    }
    return UserRole.user;
  }
}
