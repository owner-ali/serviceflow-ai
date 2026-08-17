import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme.dart';
import '../../services/supabase_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _customer;
  List<Map<String, dynamic>> _bookings = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final customer = await SupabaseService.getMyCustomerProfile();
      final bookings = customer != null ? await SupabaseService.getMyBookings(customer['id']) : <Map<String, dynamic>>[];
      setState(() {
        _customer = customer;
        _bookings = bookings;
      });
    } catch (e) {
      setState(() => _error = 'Couldn\u2019t load your dashboard. Pull to retry.');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeBooking = _bookings.where((b) => !['completed', 'paid', 'reviewed', 'cancelled'].contains(b['status'])).firstOrNull;

    return Scaffold(
      appBar: AppBar(
        title: Text('Hi, ${_customer?['full_name']?.toString().split(' ').first ?? 'there'} \u{1F44B}'),
        actions: [
          IconButton(icon: const Icon(Icons.person_outline), onPressed: () => Navigator.of(context).pushNamed('/profile')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? _DashboardSkeleton()
            : _error != null
                ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!)))
                : ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      if (activeBooking != null) _ActiveBookingCard(booking: activeBooking),
                      const SizedBox(height: 20),
                      Text('Recent services', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 12),
                      if (_bookings.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(child: Text('No bookings yet — book your first service below.')),
                        )
                      else
                        ..._bookings.take(5).map((b) => _BookingTile(booking: b)),
                    ],
                  ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).pushNamed('/booking/new'),
        icon: const Icon(Icons.add),
        label: const Text('Book a Service'),
        backgroundColor: SFColors.emerald,
      ),
    );
  }
}

class _ActiveBookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;
  const _ActiveBookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [SFColors.forest, SFColors.emerald]),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(booking['booking_code'] ?? '', style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 6),
          Text(
            (booking['status'] as String).replaceAll('_', ' ').toUpperCase(),
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: SFColors.forest),
            onPressed: () => Navigator.of(context).pushNamed('/tracking/${booking['id']}'),
            child: const Text('Track Technician'),
          ),
        ],
      ),
    );
  }
}

class _BookingTile extends StatelessWidget {
  final Map<String, dynamic> booking;
  const _BookingTile({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        title: Text(booking['booking_code'] ?? ''),
        subtitle: Text((booking['status'] as String).replaceAll('_', ' ')),
        trailing: Text(booking['scheduled_date']?.toString() ?? ''),
      ),
    );
  }
}

class _DashboardSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(height: 140, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20))),
            const SizedBox(height: 20),
            ...List.generate(4, (i) => Container(
                  height: 60,
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                )),
          ],
        ),
      ),
    );
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
