import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = SupabaseService.currentUser;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          CircleAvatar(radius: 36, child: Text((user?.email ?? '?')[0].toUpperCase())),
          const SizedBox(height: 12),
          Text(user?.email ?? '', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 24),
          ListTile(leading: const Icon(Icons.history), title: const Text('Booking history'), onTap: () {}),
          ListTile(leading: const Icon(Icons.location_on_outlined), title: const Text('Saved addresses'), onTap: () {}),
          ListTile(leading: const Icon(Icons.notifications_none), title: const Text('Notifications'), onTap: () {}),
          ListTile(leading: const Icon(Icons.dark_mode_outlined), title: const Text('Appearance'), onTap: () {}),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Log out', style: TextStyle(color: Colors.red)),
            onTap: () async {
              await SupabaseService.signOut();
              if (context.mounted) Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
            },
          ),
        ],
      ),
    );
  }
}
