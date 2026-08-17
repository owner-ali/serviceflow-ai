import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../services/supabase_service.dart';

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  Map<String, dynamic>? _technician;
  List<Map<String, dynamic>> _paidJobs = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final tech = await SupabaseService.getMyTechnicianProfile();
    if (tech == null) return;
    final jobs = await SupabaseService.client
        .from('bookings')
        .select('booking_code, final_price, updated_at, services(name)')
        .eq('technician_id', tech['id'])
        .eq('status', 'paid')
        .order('updated_at', ascending: false);
    setState(() {
      _technician = tech;
      _paidJobs = List<Map<String, dynamic>>.from(jobs);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Earnings')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [SFColors.forest, SFColors.emerald]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Total earnings', style: TextStyle(color: Colors.white70)),
                const SizedBox(height: 6),
                Text(
                  '\$${(_technician?['earnings_total'] ?? 0).toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text('${_technician?['jobs_completed'] ?? 0} jobs completed', style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Payment history', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (_paidJobs.isEmpty) const Text('No paid jobs yet.'),
          ..._paidJobs.map((j) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(j['services']?['name'] ?? j['booking_code'] ?? ''),
                  subtitle: Text(j['booking_code'] ?? ''),
                  trailing: Text('\$${j['final_price']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
              )),
        ],
      ),
    );
  }
}
