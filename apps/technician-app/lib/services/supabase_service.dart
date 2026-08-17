import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static late final SupabaseClient client;

  static Future<void> init({required String url, required String anonKey}) async {
    await Supabase.initialize(url: url, anonKey: anonKey);
    client = Supabase.instance.client;
  }

  static User? get currentUser => client.auth.currentUser;

  static Future<AuthResponse> signIn({required String email, required String password}) {
    return client.auth.signInWithPassword(email: email, password: password);
  }

  static Future<void> signOut() => client.auth.signOut();

  static Future<Map<String, dynamic>?> getMyTechnicianProfile() async {
    final userId = currentUser?.id;
    if (userId == null) return null;
    return client.from('technicians').select().eq('user_id', userId).maybeSingle();
  }

  static Future<List<Map<String, dynamic>>> getMyJobs(String technicianId) async {
    return List<Map<String, dynamic>>.from(
      await client
          .from('bookings')
          .select('*, customers(full_name, phone), services(name)')
          .eq('technician_id', technicianId)
          .order('scheduled_date'),
    );
  }

  static Future<void> updateBookingStatus(String bookingId, String status) async {
    await client.from('bookings').update({'status': status}).eq('id', bookingId);
  }

  static Future<void> setAvailability(String technicianId, bool isAvailable) async {
    await client.from('technicians').update({'is_available': isAvailable}).eq('id', technicianId);
  }

  static Future<void> pushLocation(String technicianId, String businessId, double lat, double lng, {double? heading}) async {
    await client.from('technician_locations').insert({
      'technician_id': technicianId,
      'business_id': businessId,
      'latitude': lat,
      'longitude': lng,
      'heading': heading,
    });
  }

  static Future<void> addAttachment({
    required String businessId,
    required String bookingId,
    required String filePath,
    required String category, // 'before' | 'after'
  }) async {
    await client.from('attachments').insert({
      'business_id': businessId,
      'booking_id': bookingId,
      'uploaded_by': currentUser?.id,
      'bucket': 'before-after-media',
      'file_path': filePath,
      'category': category,
    });
  }

  static Future<Map<String, dynamic>> createInvoice({
    required String businessId,
    required String bookingId,
    required List<Map<String, dynamic>> items, // {kind, name, quantity, unit_price}
    required double taxRate,
  }) async {
    final subtotal = items.fold<double>(0, (sum, i) => sum + (i['quantity'] as num) * (i['unit_price'] as num));
    final tax = subtotal * taxRate;
    final total = subtotal + tax;

    final invoice = await client
        .from('invoices')
        .insert({
          'business_id': businessId,
          'booking_id': bookingId,
          'invoice_number': 'INV-${DateTime.now().millisecondsSinceEpoch}',
          'status': 'sent',
          'subtotal': subtotal,
          'tax': tax,
          'total': total,
        })
        .select()
        .single();

    for (final item in items) {
      await client.from('invoice_items').insert({...item, 'invoice_id': invoice['id']});
    }

    await client.from('bookings').update({'status': 'invoiced', 'final_price': total}).eq('id', bookingId);

    return invoice;
  }
}
