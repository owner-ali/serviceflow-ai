import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/theme.dart';
import 'services/supabase_service.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/onboarding/onboarding_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/booking/booking_flow_screen.dart';
import 'screens/tracking/tracking_screen.dart';
import 'screens/chat/chat_screen.dart';
import 'screens/profile/profile_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SupabaseService.init(
    url: const String.fromEnvironment('SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
  );

  runApp(const ProviderScope(child: ServiceFlowCustomerApp()));
}

final _router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
    GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
    GoRoute(path: '/booking/new', builder: (_, __) => const BookingFlowScreen()),
    GoRoute(
      path: '/tracking/:bookingId',
      builder: (_, state) => TrackingScreen(bookingId: state.pathParameters['bookingId']!),
    ),
    GoRoute(
      path: '/chat/:roomId',
      builder: (_, state) => ChatScreen(roomId: state.pathParameters['roomId']!),
    ),
    GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
  ],
);

class ServiceFlowCustomerApp extends StatelessWidget {
  const ServiceFlowCustomerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ServiceFlow AI',
      debugShowCheckedModeBanner: false,
      theme: SFTheme.light(),
      darkTheme: SFTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: _router,
    );
  }
}
