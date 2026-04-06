import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'package:esim_frontend/features/auth/presentation/widgets/login_form.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // Clear any previous error when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(() => _errorMessage = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<AuthState>>(authProvider, (_, next) {
      next.whenOrNull(
        data: (state) {
          if (state is AuthAuthenticated) context.go(RouteNames.home);
        },
        error: (err, __) {
          setState(() {
            _errorMessage = err is AppException
                ? err.message
                : 'Une erreur est survenue. Veuillez réessayer.';
          });
        },
      );
    });

    return Scaffold(
      backgroundColor: const Color(0xFF6D28D9),
      body: Column(
        children: [
          _buildGradientHeader(context),
          Expanded(child: _buildBottomCard(context)),
        ],
      ),
    );
  }

  Widget _buildGradientHeader(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF5B21B6), Color(0xFF7C3AED), Color(0xFF4338CA)],
        ),
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            top: -40,
            right: -40,
            child: _DecorativeCircle(
              size: 180,
              color: Colors.white.withValues(alpha: 0.05),
            ),
          ),
          Positioned(
            bottom: 10,
            left: -30,
            child: _DecorativeCircle(
              size: 140,
              color: const Color(0xFF818CF8).withValues(alpha: 0.10),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _PillBadge(),
                  const SizedBox(height: 28),
                  const Text(
                    'Bon retour ! 👋',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Connectez-vous à votre compte',
                    style: TextStyle(
                      color: const Color(0xFFDDD6FE),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomCard(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          24,
          32,
          24,
          24 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Connexion',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Entrez vos identifiants pour continuer',
              style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
            ),
            const SizedBox(height: 24),

            // Error box
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (child, anim) => FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, -0.1),
                    end: Offset.zero,
                  ).animate(anim),
                  child: child,
                ),
              ),
              child: _errorMessage != null
                  ? _ErrorBox(key: ValueKey(_errorMessage), message: _errorMessage!)
                  : const SizedBox.shrink(),
            ),
            if (_errorMessage != null) const SizedBox(height: 16),

            LoginForm(
              errorMessage: _errorMessage,
              onErrorDismiss: () => setState(() => _errorMessage = null),
            ),

            const SizedBox(height: 28),
            _buildDivider(),
            const SizedBox(height: 24),
            _buildSignupLink(context),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        const Expanded(child: Divider(color: Color(0xFFE5E7EB))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'OU',
            style: TextStyle(
              color: Colors.grey.shade400,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const Expanded(child: Divider(color: Color(0xFFE5E7EB))),
      ],
    );
  }

  Widget _buildSignupLink(BuildContext context) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            "Pas encore de compte ? ",
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
          ),
          GestureDetector(
            onTap: () => context.push(RouteNames.signup),
            child: const Text(
              'Créer un compte',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared auth widgets ────────────────────────────────────────────────────

class _PillBadge extends StatelessWidget {
  const _PillBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: Colors.white.withValues(alpha: 0.20)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.flight, color: AppColors.secondary, size: 16),
          SizedBox(width: 8),
          Text(
            'NetyFly eSIM',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _DecorativeCircle extends StatelessWidget {
  const _DecorativeCircle({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  const _ErrorBox({required this.message, super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
