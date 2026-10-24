import 'package:flutter/material.dart';

import 'app_routes.dart';
import '../services/api_service.dart';
import '../../screens/authentication/splash/splash_screen.dart';
import '../../screens/authentication/login/login_screen.dart';
import '../../screens/authentication/signup/signup_screen.dart';
import '../../screens/authentication/forgot_password/forgot_password_screen.dart';
import '../../screens/authentication/verify_email/verify_email_screen.dart';
import '../../screens/user_mode/user_dashboard_screen.dart';
import '../../screens/soc_mode/soc_dashboard_screen.dart';
import '../../screens/admin_mode/admin_dashboard_screen.dart';

/// Centralized route generation with role-based dashboard resolution.
class AppRouter {
  AppRouter._();

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return _buildRoute(const SplashScreen(), settings);
      case AppRoutes.login:
        return _buildFadeRoute(const LoginScreen(), settings);
      case AppRoutes.signUp:
        return _buildSlideRoute(const SignUpScreen(), settings);
      case AppRoutes.forgotPassword:
        return _buildSlideRoute(const ForgotPasswordScreen(), settings);
      case AppRoutes.verifyEmail:
        return _buildFadeRoute(const VerifyEmailScreen(), settings);
      case AppRoutes.userDashboard:
        return _buildFadeRoute(const UserDashboardScreen(), settings);
      case AppRoutes.socDashboard:
        return _buildFadeRoute(const SocDashboardScreen(), settings);
      case AppRoutes.adminDashboard:
        return _buildFadeRoute(const AdminDashboardScreen(), settings);
      case AppRoutes.protectionDashboard:
      case AppRoutes.home:
        final role = ApiService.instance.currentUserRole;
        if (role.isAdmin) {
          return _buildFadeRoute(const AdminDashboardScreen(), settings);
        } else if (role.isSocAnalyst) {
          return _buildFadeRoute(const SocDashboardScreen(), settings);
        }
        return _buildFadeRoute(const UserDashboardScreen(), settings);
      default:
        return _buildRoute(const LoginScreen(), settings);
    }
  }

  /// Standard material route.
  static MaterialPageRoute<dynamic> _buildRoute(
    Widget page,
    RouteSettings settings,
  ) {
    return MaterialPageRoute(
      builder: (_) => page,
      settings: settings,
    );
  }

  /// Fade transition route for smooth screen changes.
  static PageRouteBuilder<dynamic> _buildFadeRoute(
    Widget page,
    RouteSettings settings,
  ) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: CurvedAnimation(
            parent: animation,
            curve: Curves.easeInOut,
          ),
          child: child,
        );
      },
      transitionDuration: const Duration(milliseconds: 400),
    );
  }

  /// Slide-up transition route for form screens.
  static PageRouteBuilder<dynamic> _buildSlideRoute(
    Widget page,
    RouteSettings settings,
  ) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        final curvedAnimation = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
        );
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(1.0, 0.0),
            end: Offset.zero,
          ).animate(curvedAnimation),
          child: FadeTransition(
            opacity: curvedAnimation,
            child: child,
          ),
        );
      },
      transitionDuration: const Duration(milliseconds: 350),
    );
  }
}
