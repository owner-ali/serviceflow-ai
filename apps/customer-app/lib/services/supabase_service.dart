import 'package:supabase_flutter/supabase_flutter.dart';

/// Central Supabase access point. Initialize once in main() with:
/// await SupabaseService.init(url: ..., anonKey: ...);
/// Never hardcode the anon key — load from --dart-define or a build-time config file.
class SupabaseService {
  static late final SupabaseClient client;

  static Future<void> init({required String url, required String anonKey}) async {
    await Supabase.initialize(url: url, anonKey: anonKey);
    client = Supabase.instance.client;
  }

  static User? get currentUser => client.auth.currentUser;

  static Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String fullName,
  }) {
    return client.auth.signUp(
      email: email,
      password: password,
      data: {'full_name': fullName, 'role': 'customer'},
    );
  }

  static Future<AuthResponse> signIn({required String email, required String password}) {
    return client.auth.signInWithPassword(email: email, password: password);
  }

  static Future<void> signOut() => client.auth.signOut();

  static Future<void> sendPasswordReset(String email) => client.auth.resetPasswordForEmail(email);

  /// Fetches the customer row linked to the current auth user, business-scoped by RLS.
  static Future<Map<String, dynamic>?> getMyCustomerProfile() async {
    final userId = currentUser?.id;
    if (userId == null) return null;
    return client.from('customers').select().eq('user_id', userId).maybeSingle();
  }

  static Future<List<Map<String, dynamic>>> getServices({String? categoryId}) async {
    var query = client.from('services').select().eq('is_active', true);
    if (categoryId != null) query = query.eq('category_id', categoryId);
    return List<Map<String, dynamic>>.from(await query);
  }

  static Future<Map<String, dynamic>> createBooking(Map<String, dynamic> payload) async {
    return client.from('bookings').insert(payload).select().single();
  }

  static Future<List<Map<String, dynamic>>> getMyBookings(String customerId) async {
    return List<Map<String, dynamic>>.from(
      await client
          .from('bookings')
          .select()
          .eq('customer_id', customerId)
          .order('created_at', ascending: false),
    );
  }

  /// Real-time technician location for an active booking.
  static RealtimeChannel subscribeToTechnicianLocation({
    required String technicianId,
    required void Function(Map<String, dynamic> location) onUpdate,
  }) {
    return client
        .channel('technician_location_$technicianId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'technician_locations',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'technician_id',
            value: technicianId,
          ),
          callback: (payload) => onUpdate(payload.newRecord),
        )
        .subscribe();
  }
}
