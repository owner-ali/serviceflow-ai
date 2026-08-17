import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/theme.dart';
import 'services/supabase_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/job/job_detail_screen.dart';
import 'screens/earnings/earnings_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService.init(
    url: const String.fromEnvironment('SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
  );
  runApp(const ProviderScope(child: ServiceFlowTechnicianApp()));
}

final _router = GoRouter(
  initialLocation: SupabaseService.currentUser != null ? '/dashboard' : '/login',
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
    GoRoute(
      path: '/job/:bookingId',
      builder: (_, state) => JobDetailScreen(bookingId: state.pathParameters['bookingId']!),
    ),
    GoRoute(path: '/earnings', builder: (_, __) => const EarningsScreen()),
  ],
);

class ServiceFlowTechnicianApp extends StatelessWidget {
  const ServiceFlowTechnicianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ServiceFlow AI — Technician',
      debugShowCheckedModeBanner: false,
      theme: SFTheme.light(),
      darkTheme: SFTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: _router,
    );
  }
}
