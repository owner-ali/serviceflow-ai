import 'package:flutter/material.dart';
import '../../core/theme.dart';

class _OnboardSlide {
  final IconData icon;
  final String title;
  final String description;
  const _OnboardSlide(this.icon, this.title, this.description);
}

const _slides = [
  _OnboardSlide(
    Icons.bolt_rounded,
    'Easy Booking',
    'Book a trusted technician in under a minute — pick a service, describe the problem, done.',
  ),
  _OnboardSlide(
    Icons.location_on_rounded,
    'Live Technician Tracking',
    'Watch your technician\u2019s ETA update in real time, right up to your door.',
  ),
  _OnboardSlide(
    Icons.auto_awesome_rounded,
    'AI-Powered Assistance',
    'Our AI analyzes your problem instantly and suggests the right service and priority.',
  ),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
                child: const Text('Skip'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (_, i) {
                  final s = _slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: SFColors.emerald.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(s.icon, size: 56, color: SFColors.emerald),
                        ),
                        const SizedBox(height: 32),
                        Text(s.title, style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        Text(
                          s.description,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _slides.length,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: i == _index ? 20 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == _index ? SFColors.emerald : SFColors.emerald.withOpacity(0.25),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (_index < _slides.length - 1) {
                      _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
                    } else {
                      Navigator.of(context).pushReplacementNamed('/login');
                    }
                  },
                  child: Text(_index < _slides.length - 1 ? 'Next' : 'Get Started'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
