import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/theme.dart';
import '../../services/supabase_service.dart';

class TrackingScreen extends StatefulWidget {
  final String bookingId;
  const TrackingScreen({super.key, required this.bookingId});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _booking;
  LatLng? _technicianPosition;
  LatLng? _displayedPosition; // interpolated position actually drawn on the map
  GoogleMapController? _mapController;
  late final AnimationController _moveController;
  Animation<LatLng>? _moveAnimation;
  String _etaText = 'Calculating…';

  @override
  void initState() {
    super.initState();
    _moveController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));
    _load();
  }

  Future<void> _load() async {
    final data = await SupabaseService.client
        .from('bookings')
        .select('*, technicians(id, rating, users(full_name))')
        .eq('id', widget.bookingId)
        .single();
    setState(() => _booking = data);

    final technicianId = data['technician_id'] as String?;
    if (technicianId != null) {
      final loc = await SupabaseService.client
          .from('technician_current_location')
          .select()
          .eq('technician_id', technicianId)
          .maybeSingle();
      if (loc != null) {
        final pos = LatLng(loc['latitude'], loc['longitude']);
        setState(() {
          _technicianPosition = pos;
          _displayedPosition = pos;
        });
      }

      SupabaseService.subscribeToTechnicianLocation(
        technicianId: technicianId,
        onUpdate: (loc) {
          final newPos = LatLng(loc['latitude'], loc['longitude']);
          _animateMarkerTo(newPos);
          _updateEta(newPos);
        },
      );
    }
  }

  /// Smoothly tweens the technician marker from its last drawn position to the
  /// new GPS fix, instead of snapping — matches the "animate the marker
  /// movement smoothly" requirement from the live-tracking spec.
  void _animateMarkerTo(LatLng newPos) {
    final from = _displayedPosition ?? newPos;
    _moveAnimation = LatLngTween(begin: from, end: newPos).animate(
      CurvedAnimation(parent: _moveController, curve: Curves.easeInOut),
    )..addListener(() {
        setState(() => _displayedPosition = _moveAnimation!.value);
        _mapController?.animateCamera(CameraUpdate.newLatLng(_moveAnimation!.value));
      });
    _technicianPosition = newPos;
    _moveController.forward(from: 0);
  }

  void _updateEta(LatLng technicianPos) {
    // Simple distance-based estimate for the demo; production would use a
    // routing API (Mapbox Directions / Google Directions) for real ETA + traffic.
    final customerLat = (_booking?['latitude'] as num?)?.toDouble() ?? technicianPos.latitude;
    final customerLng = (_booking?['longitude'] as num?)?.toDouble() ?? technicianPos.longitude;
    final distanceKm = _haversineKm(technicianPos.latitude, technicianPos.longitude, customerLat, customerLng);
    final minutes = (distanceKm / 30 * 60).clamp(1, 60).round(); // assumes ~30km/h average
    setState(() => _etaText = '$minutes min away');
  }

  double _haversineKm(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371.0;
    final dLat = (lat2 - lat1) * (3.1415926535 / 180);
    final dLon = (lon2 - lon1) * (3.1415926535 / 180);
    final a = (dLat / 2).abs() * (dLat / 2).abs() + (dLon / 2).abs() * (dLon / 2).abs();
    return r * 2 * a.clamp(0, 1);
  }

  @override
  void dispose() {
    _moveController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_booking == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final technicianName = _booking!['technicians']?['users']?['full_name'] ?? 'Technician';
    final status = (_booking!['status'] as String).replaceAll('_', ' ');
    final customerLat = (_booking!['latitude'] as num?)?.toDouble() ?? 33.6844;
    final customerLng = (_booking!['longitude'] as num?)?.toDouble() ?? 73.0479;

    return Scaffold(
      appBar: AppBar(title: Text(_booking!['booking_code'] ?? '')),
      body: Column(
        children: [
          Expanded(
            child: Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(target: LatLng(customerLat, customerLng), zoom: 13),
                  onMapCreated: (c) => _mapController = c,
                  markers: {
                    Marker(markerId: const MarkerId('customer'), position: LatLng(customerLat, customerLng),
                        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue)),
                    if (_displayedPosition != null)
                      Marker(markerId: const MarkerId('technician'), position: _displayedPosition!,
                          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen)),
                  },
                ),
                if (_technicianPosition != null)
                  Positioned(
                    top: 16, left: 16,
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: Container(
                        key: ValueKey(_etaText),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(20)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.directions_car, color: SFColors.mint, size: 16),
                          const SizedBox(width: 6),
                          Text(_etaText, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 12)],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: Text(
                    status.toUpperCase(),
                    key: ValueKey(status),
                    style: const TextStyle(color: SFColors.emerald, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const CircleAvatar(child: Icon(Icons.person)),
                    const SizedBox(width: 12),
                    Expanded(child: Text(technicianName, style: const TextStyle(fontWeight: FontWeight.w600))),
                    IconButton(icon: const Icon(Icons.call_outlined), onPressed: () {}),
                    IconButton(
                      icon: const Icon(Icons.chat_bubble_outline),
                      onPressed: () => Navigator.of(context).pushNamed('/chat/${widget.bookingId}'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Tween for interpolating between two LatLng points frame-by-frame.
class LatLngTween extends Tween<LatLng> {
  LatLngTween({required LatLng begin, required LatLng end}) : super(begin: begin, end: end);

  @override
  LatLng lerp(double t) {
    final b = begin!;
    final e = end!;
    return LatLng(
      b.latitude + (e.latitude - b.latitude) * t,
      b.longitude + (e.longitude - b.longitude) * t,
    );
  }
}
