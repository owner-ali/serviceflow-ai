import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme.dart';
import '../../services/supabase_service.dart';

enum _Urgency { low, normal, urgent, emergency }

class BookingFlowScreen extends StatefulWidget {
  const BookingFlowScreen({super.key});

  @override
  State<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends State<BookingFlowScreen> {
  final _pageController = PageController();
  int _step = 0;
  static const _totalSteps = 6; // category, service, problem+media, urgency+schedule, address, confirm

  Map<String, dynamic>? _selectedService;
  final _problemController = TextEditingController();
  final _notesController = TextEditingController();
  final _addressController = TextEditingController();
  final List<XFile> _images = [];
  _Urgency _urgency = _Urgency.normal;
  DateTime? _date;
  TimeOfDay? _time;
  bool _submitting = false;

  List<Map<String, dynamic>> _services = [];
  bool _loadingServices = true;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    try {
      final services = await SupabaseService.getServices();
      setState(() {
        _services = services;
        _loadingServices = false;
      });
    } catch (_) {
      setState(() => _loadingServices = false);
    }
  }

  void _next() {
    if (_step < _totalSteps - 1) {
      setState(() => _step++);
      _pageController.nextPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    } else {
      _submit();
    }
  }

  void _back() {
    if (_step > 0) {
      setState(() => _step--);
      _pageController.previousPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    } else {
      Navigator.of(context).pop();
    }
  }

  Future<void> _submit() async {
    if (_selectedService == null || _addressController.text.trim().isEmpty) return;
    setState(() => _submitting = true);
    try {
      final customer = await SupabaseService.getMyCustomerProfile();
      if (customer == null) throw Exception('No customer profile');

      final booking = await SupabaseService.createBooking({
        'business_id': _selectedService!['business_id'],
        'customer_id': customer['id'],
        'service_id': _selectedService!['id'],
        'problem_description': _problemController.text.trim(),
        'urgency': _urgency.name,
        'scheduled_date': _date?.toIso8601String().substring(0, 10),
        'scheduled_time': _time != null ? '${_time!.hour}:${_time!.minute}:00' : null,
        'address': _addressController.text.trim(),
        'notes': _notesController.text.trim(),
      });

      // TODO(Phase 8 wiring): upload _images to booking-attachments bucket, then
      // call the ai-proxy edge function's service_analysis endpoint with the
      // problem description + image URLs to populate ai_estimated_* fields.

      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/tracking/${booking['id']}');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Booking failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: _back),
        title: LinearProgressIndicator(
          value: (_step + 1) / _totalSteps,
          backgroundColor: Colors.grey.shade200,
          color: SFColors.emerald,
        ),
      ),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          _stepWrapper(_ServiceSelectStep(
            loading: _loadingServices,
            services: _services,
            selected: _selectedService,
            onSelect: (s) => setState(() => _selectedService = s),
          )),
          _stepWrapper(_ProblemStep(
            controller: _problemController,
            images: _images,
            onAddImage: (x) => setState(() => _images.add(x)),
          )),
          _stepWrapper(_UrgencyStep(urgency: _urgency, onChange: (u) => setState(() => _urgency = u))),
          _stepWrapper(_ScheduleStep(
            date: _date,
            time: _time,
            onDate: (d) => setState(() => _date = d),
            onTime: (t) => setState(() => _time = t),
          )),
          _stepWrapper(_AddressStep(addressController: _addressController, notesController: _notesController)),
          _stepWrapper(_ConfirmStep(
            service: _selectedService,
            problem: _problemController.text,
            urgency: _urgency.name,
            date: _date,
            time: _time,
            address: _addressController.text,
          )),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ElevatedButton(
            onPressed: _submitting ? null : _next,
            child: _submitting
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(_step == _totalSteps - 1 ? 'Confirm Booking' : 'Continue'),
          ),
        ),
      ),
    );
  }

  Widget _stepWrapper(Widget child) => SingleChildScrollView(padding: const EdgeInsets.all(24), child: child);
}

class _ServiceSelectStep extends StatelessWidget {
  final bool loading;
  final List<Map<String, dynamic>> services;
  final Map<String, dynamic>? selected;
  final ValueChanged<Map<String, dynamic>> onSelect;
  const _ServiceSelectStep({required this.loading, required this.services, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('What do you need help with?', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        ...services.map((s) => Card(
              color: selected?['id'] == s['id'] ? SFColors.emerald.withOpacity(0.1) : null,
              child: ListTile(
                title: Text(s['name'] ?? ''),
                subtitle: Text('From \$${s['starting_price']} \u00b7 ${s['estimated_duration_minutes']} min'),
                trailing: selected?['id'] == s['id'] ? const Icon(Icons.check_circle, color: SFColors.emerald) : null,
                onTap: () => onSelect(s),
              ),
            )),
      ],
    );
  }
}

class _ProblemStep extends StatelessWidget {
  final TextEditingController controller;
  final List<XFile> images;
  final ValueChanged<XFile> onAddImage;
  const _ProblemStep({required this.controller, required this.images, required this.onAddImage});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Describe the problem', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        TextField(
          controller: controller,
          maxLines: 4,
          decoration: const InputDecoration(hintText: 'e.g. AC not cooling, making a rattling noise…', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () async {
            final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
            if (picked != null) onAddImage(picked);
          },
          icon: const Icon(Icons.add_a_photo_outlined),
          label: Text('Add photo (${images.length} added)'),
        ),
      ],
    );
  }
}

class _UrgencyStep extends StatelessWidget {
  final _Urgency urgency;
  final ValueChanged<_Urgency> onChange;
  const _UrgencyStep({required this.urgency, required this.onChange});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('How urgent is this?', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        ..._Urgency.values.map((u) => RadioListTile<_Urgency>(
              value: u,
              groupValue: urgency,
              onChanged: (v) => onChange(v!),
              title: Text(u.name[0].toUpperCase() + u.name.substring(1)),
            )),
      ],
    );
  }
}

class _ScheduleStep extends StatelessWidget {
  final DateTime? date;
  final TimeOfDay? time;
  final ValueChanged<DateTime> onDate;
  final ValueChanged<TimeOfDay> onTime;
  const _ScheduleStep({required this.date, required this.time, required this.onDate, required this.onTime});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('When works for you?', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        ListTile(
          shape: RoundedRectangleBorder(side: BorderSide(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
          title: Text(date == null ? 'Select date' : '${date!.year}-${date!.month}-${date!.day}'),
          trailing: const Icon(Icons.calendar_today_outlined),
          onTap: () async {
            final picked = await showDatePicker(
              context: context, initialDate: DateTime.now(),
              firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 90)),
            );
            if (picked != null) onDate(picked);
          },
        ),
        const SizedBox(height: 12),
        ListTile(
          shape: RoundedRectangleBorder(side: BorderSide(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
          title: Text(time == null ? 'Select time' : time!.format(context)),
          trailing: const Icon(Icons.access_time),
          onTap: () async {
            final picked = await showTimePicker(context: context, initialTime: TimeOfDay.now());
            if (picked != null) onTime(picked);
          },
        ),
      ],
    );
  }
}

class _AddressStep extends StatelessWidget {
  final TextEditingController addressController;
  final TextEditingController notesController;
  const _AddressStep({required this.addressController, required this.notesController});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Where should we come?', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        TextField(controller: addressController, decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder())),
        const SizedBox(height: 16),
        TextField(controller: notesController, maxLines: 2, decoration: const InputDecoration(labelText: 'Notes (optional)', border: OutlineInputBorder())),
      ],
    );
  }
}

class _ConfirmStep extends StatelessWidget {
  final Map<String, dynamic>? service;
  final String problem;
  final String urgency;
  final DateTime? date;
  final TimeOfDay? time;
  final String address;
  const _ConfirmStep({required this.service, required this.problem, required this.urgency, required this.date, required this.time, required this.address});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Confirm your booking', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        _row('Service', service?['name'] ?? '—'),
        _row('Problem', problem.isEmpty ? '—' : problem),
        _row('Urgency', urgency),
        _row('Date', date != null ? '${date!.year}-${date!.month}-${date!.day}' : '—'),
        _row('Time', time?.format(context) ?? '—'),
        _row('Address', address.isEmpty ? '—' : address),
        const SizedBox(height: 12),
        Text(
          'AI-generated estimate — final diagnosis and price may vary after technician inspection.',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
      ],
    );
  }

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 90, child: Text(label, style: const TextStyle(color: Colors.grey))),
            Expanded(child: Text(value)),
          ],
        ),
      );
}
