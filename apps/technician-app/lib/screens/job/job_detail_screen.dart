import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:signature/signature.dart';
import '../../core/theme.dart';
import '../../services/supabase_service.dart';

const _statusFlow = [
  'assigned', 'accepted', 'on_the_way', 'arrived', 'inspection',
  'working', 'completed', 'invoiced', 'paid',
];

class JobDetailScreen extends StatefulWidget {
  final String bookingId;
  const JobDetailScreen({super.key, required this.bookingId});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  Map<String, dynamic>? _job;
  bool _loading = true;
  final List<Map<String, dynamic>> _parts = [];
  final _partNameController = TextEditingController();
  final _partQtyController = TextEditingController(text: '1');
  final _partPriceController = TextEditingController();
  final _signatureController = SignatureController(penStrokeWidth: 3, penColor: Colors.black);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await SupabaseService.client
        .from('bookings')
        .select('*, customers(full_name, phone, address), services(name)')
        .eq('id', widget.bookingId)
        .single();
    setState(() {
      _job = data;
      _loading = false;
    });
  }

  Future<void> _advanceStatus() async {
    final current = _job!['status'] as String;
    final idx = _statusFlow.indexOf(current);
    if (idx < 0 || idx >= _statusFlow.length - 1) return;
    final next = _statusFlow[idx + 1];

    if (next == 'invoiced') {
      await _createInvoiceFlow();
      return;
    }

    await SupabaseService.updateBookingStatus(widget.bookingId, next);
    await _load();
  }

  Future<void> _addPhoto(String category) async {
    final picked = await ImagePicker().pickImage(source: ImageSource.camera);
    if (picked == null) return;
    await SupabaseService.addAttachment(
      businessId: _job!['business_id'],
      bookingId: widget.bookingId,
      filePath: picked.path, // real upload to Supabase Storage happens before this in production
      category: category,
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$category photo added')));
    }
  }

  void _addPart() {
    final name = _partNameController.text.trim();
    final qty = double.tryParse(_partQtyController.text) ?? 1;
    final price = double.tryParse(_partPriceController.text) ?? 0;
    if (name.isEmpty || price <= 0) return;
    setState(() {
      _parts.add({'kind': 'part', 'name': name, 'quantity': qty, 'unit_price': price});
      _partNameController.clear();
      _partQtyController.text = '1';
      _partPriceController.clear();
    });
  }

  Future<void> _createInvoiceFlow() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 20, right: 20, top: 20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Customer signature', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Container(
                height: 160,
                decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
                child: Signature(controller: _signatureController, backgroundColor: Colors.white),
              ),
              TextButton(onPressed: () => _signatureController.clear(), child: const Text('Clear')),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final total = _parts.fold<double>(0, (s, p) => s + (p['quantity'] as num) * (p['unit_price'] as num));
                    await SupabaseService.createInvoice(
                      businessId: _job!['business_id'],
                      bookingId: widget.bookingId,
                      items: _parts.isEmpty ? [
                        {'kind': 'labour', 'name': 'Service labour', 'quantity': 1, 'unit_price': total > 0 ? total : 50},
                      ] : _parts,
                      taxRate: 0.05,
                    );
                    if (mounted) Navigator.pop(context);
                    await _load();
                  },
                  child: const Text('Generate Invoice'),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _job == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final status = _job!['status'] as String;
    final idx = _statusFlow.indexOf(status);
    final canAdvance = idx >= 0 && idx < _statusFlow.length - 1;

    return Scaffold(
      appBar: AppBar(title: Text(_job!['booking_code'] ?? '')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _StatusStepper(current: status),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_job!['services']?['name'] ?? '', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(_job!['customers']?['full_name'] ?? ''),
                  Text(_job!['customers']?['address'] ?? _job!['address'] ?? '', style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 8),
                  Text(_job!['problem_description'] ?? '', style: const TextStyle(fontStyle: FontStyle.italic)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: OutlinedButton.icon(onPressed: () => _addPhoto('before'), icon: const Icon(Icons.camera_alt_outlined), label: const Text('Before'))),
              const SizedBox(width: 12),
              Expanded(child: OutlinedButton.icon(onPressed: () => _addPhoto('after'), icon: const Icon(Icons.camera_alt), label: const Text('After'))),
            ],
          ),
          const SizedBox(height: 24),
          Text('Parts', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ..._parts.map((p) => ListTile(
                title: Text(p['name']),
                subtitle: Text('Qty ${p['quantity']} \u00d7 \$${p['unit_price']}'),
                trailing: Text('\$${(p['quantity'] as num) * (p['unit_price'] as num)}'),
              )),
          Row(
            children: [
              Expanded(flex: 2, child: TextField(controller: _partNameController, decoration: const InputDecoration(hintText: 'Part name'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _partQtyController, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'Qty'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _partPriceController, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'Price'))),
              IconButton(icon: const Icon(Icons.add_circle, color: SFColors.emerald), onPressed: _addPart),
            ],
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              if (status == 'assigned') ...[
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => SupabaseService.updateBookingStatus(widget.bookingId, 'cancelled').then((_) => _load()),
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: canAdvance ? _advanceStatus : null,
                  child: Text(canAdvance ? 'Mark as ${_statusFlow[idx + 1].replaceAll('_', ' ')}' : 'Job complete'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusStepper extends StatelessWidget {
  final String current;
  const _StatusStepper({required this.current});

  @override
  Widget build(BuildContext context) {
    final idx = _statusFlow.indexOf(current);
    return SizedBox(
      height: 8,
      child: Row(
        children: List.generate(_statusFlow.length, (i) {
          final filled = i <= idx;
          final justCompleted = i == idx;
          return Expanded(
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: filled ? 1 : 0),
              duration: Duration(milliseconds: 350 + i * 40),
              curve: Curves.easeOutCubic,
              builder: (context, t, _) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 1.5),
                  height: justCompleted ? 10 : 8,
                  decoration: BoxDecoration(
                    color: Color.lerp(Colors.grey.shade200, SFColors.emerald, t),
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: justCompleted
                        ? [BoxShadow(color: SFColors.emerald.withOpacity(0.4), blurRadius: 6, spreadRadius: 1)]
                        : null,
                  ),
                );
              },
            ),
          );
        }),
      ),
    );
  }
}
