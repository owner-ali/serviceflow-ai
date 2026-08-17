import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../services/supabase_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _technician;
  List<Map<String, dynamic>> _jobs = [];
  bool _loading = true;
  bool _available = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final tech = await SupabaseService.getMyTechnicianProfile();
    final jobs = tech != null ? await SupabaseService.getMyJobs(tech['id']) : <Map<String, dynamic>>[];
    setState(() {
      _technician = tech;
      _jobs = jobs;
      _available = tech?['is_available'] ?? true;
      _loading = false;
    });
  }

  Future<void> _toggleAvailability(bool value) async {
    if (_technician == null) return;
    setState(() => _available = value);
    await SupabaseService.setAvailability(_technician!['id'], value);
  }

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final todaysJobs = _jobs.where((j) {
      final d = j['scheduled_date'];
      if (d == null) return false;
      final date = DateTime.tryParse(d.toString());
      return date != null && date.year == today.year && date.month == today.month && date.day == today.day;
    }).toList();
    final pending = _jobs.where((j) => j['status'] == 'assigned').toList();
    final active = _jobs.where((j) => !['completed', 'invoiced', 'paid', 'reviewed', 'cancelled', 'assigned'].contains(j['status'])).toList();
    final completed = _jobs.where((j) => j['status'] == 'completed' || j['status'] == 'paid').toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          Row(
            children: [
              Text(_available ? 'Available' : 'Offline', style: const TextStyle(fontSize: 12)),
              Switch(value: _available, activeColor: SFColors.emerald, onChanged: _toggleAvailability),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Row(
                    children: [
                      Expanded(child: _StatTile(label: "Today's Jobs", value: '${todaysJobs.length}')),
                      const SizedBox(width: 12),
                      Expanded(child: _StatTile(label: 'Pending', value: '${pending.length}')),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _StatTile(label: 'Rating', value: (_technician?['rating'] ?? 0).toStringAsFixed(1))),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatTile(
                          label: 'Earnings',
                          value: '\$${(_technician?['earnings_total'] ?? 0).toStringAsFixed(0)}',
                          onTap: () => Navigator.of(context).pushNamed('/earnings'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  if (active.isNotEmpty) ...[
                    Text('Active job', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ...active.map((j) => _JobCard(job: j, highlight: true)),
                    const SizedBox(height: 20),
                  ],
                  Text('Pending jobs', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  if (pending.isEmpty) const Text('No pending jobs right now.'),
                  ...pending.map((j) => _JobCard(job: j)),
                  const SizedBox(height: 20),
                  Text('Completed', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  ...completed.take(5).map((j) => _JobCard(job: j)),
                ],
              ),
            ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback? onTap;
  const _StatTile({required this.label, required this.value, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(16)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  final Map<String, dynamic> job;
  final bool highlight;
  const _JobCard({required this.job, this.highlight = false});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: highlight ? SFColors.emerald.withOpacity(0.08) : null,
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        title: Text(job['services']?['name'] ?? job['booking_code'] ?? ''),
        subtitle: Text('${job['customers']?['full_name'] ?? ''} \u00b7 ${(job['status'] as String).replaceAll('_', ' ')}'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.of(context).pushNamed('/job/${job['id']}'),
      ),
    );
  }
}
