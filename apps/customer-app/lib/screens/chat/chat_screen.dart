import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../services/supabase_service.dart';

class ChatScreen extends StatefulWidget {
  final String roomId; // booking_id used as room lookup key here
  const ChatScreen({super.key, required this.roomId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final List<Map<String, dynamic>> _messages = [];
  String? _chatRoomId;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    var room = await SupabaseService.client
        .from('chat_rooms')
        .select()
        .eq('booking_id', widget.roomId)
        .maybeSingle();

    room ??= await SupabaseService.client
        .from('chat_rooms')
        .insert({'booking_id': widget.roomId, 'kind': 'customer_technician'})
        .select()
        .single();

    setState(() => _chatRoomId = room!['id']);

    final history = await SupabaseService.client
        .from('chat_messages')
        .select()
        .eq('chat_room_id', _chatRoomId as Object)
        .order('created_at');
    setState(() => _messages.addAll(List<Map<String, dynamic>>.from(history)));

    SupabaseService.client
        .channel('chat_$_chatRoomId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'chat_messages',
          filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'chat_room_id', value: _chatRoomId),
          callback: (payload) => setState(() => _messages.add(payload.newRecord)),
        )
        .subscribe();
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _chatRoomId == null) return;
    _messageController.clear();
    await SupabaseService.client.from('chat_messages').insert({
      'chat_room_id': _chatRoomId,
      'sender_id': SupabaseService.currentUser!.id,
      'body': text,
    });
  }

  @override
  Widget build(BuildContext context) {
    final myId = SupabaseService.currentUser?.id;
    return Scaffold(
      appBar: AppBar(title: const Text('Chat')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (_, i) {
                final m = _messages[_messages.length - 1 - i];
                final isMe = m['sender_id'] == myId;
                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isMe ? SFColors.emerald : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(m['body'] ?? '', style: TextStyle(color: isMe ? Colors.white : Colors.black87)),
                  ),
                );
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: const InputDecoration(hintText: 'Type a message…', border: OutlineInputBorder()),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.send, color: SFColors.emerald), onPressed: _send),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
