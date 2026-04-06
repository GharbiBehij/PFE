import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:esim_frontend/core/theme/app_theme.dart';
import 'package:esim_frontend/features/auth/presentation/providers/auth_provider.dart';

class LoginForm extends ConsumerStatefulWidget {
  const LoginForm({
    this.errorMessage,
    this.onErrorDismiss,
    super.key,
  });

  final String? errorMessage;
  final VoidCallback? onErrorDismiss;

  @override
  ConsumerState<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends ConsumerState<LoginForm> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscurePass = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    final email = _emailCtrl.text.trim();
    final password = _passCtrl.text;

    if (email.isEmpty || password.isEmpty) return;

    ref.read(authProvider.notifier).login(
          email: email,
          password: password,
        );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider).isLoading;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Email field
        _AuthTextField(
          controller: _emailCtrl,
          label: 'Adresse e-mail',
          hint: 'votre@email.com',
          prefixIcon: Icons.mail_outline_rounded,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          enabled: !isLoading,
        ),
        const SizedBox(height: 16),

        // Password field
        _AuthTextField(
          controller: _passCtrl,
          label: 'Mot de passe',
          hint: '••••••••',
          prefixIcon: Icons.lock_outline_rounded,
          obscureText: _obscurePass,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _submit(),
          enabled: !isLoading,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePass
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: AppColors.textSecondary,
              size: 20,
            ),
            onPressed: () => setState(() => _obscurePass = !_obscurePass),
          ),
        ),
        const SizedBox(height: 8),

        // Forgot password
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: isLoading ? null : () {},
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text(
              'Mot de passe oublié ?',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Submit button
        SizedBox(
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.secondary,
              foregroundColor: const Color(0xFF111827),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 3,
              shadowColor: AppColors.secondary.withValues(alpha: 0.4),
              disabledBackgroundColor: AppColors.secondary.withValues(alpha: 0.6),
            ),
            onPressed: isLoading ? null : _submit,
            child: isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Color(0xFF111827),
                    ),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Se connecter',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, size: 18),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}

// ── Shared auth text field ─────────────────────────────────────────────────

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.prefixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.onSubmitted,
    this.suffixIcon,
    this.enabled = true,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData prefixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Widget? suffixIcon;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          onSubmitted: onSubmitted,
          enabled: enabled,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 15,
          ),
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: const Color(0xFFF9FAFB),
            prefixIcon: Icon(prefixIcon, color: AppColors.textSecondary, size: 20),
            suffixIcon: suffixIcon,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
          ),
        ),
      ],
    );
  }
}
