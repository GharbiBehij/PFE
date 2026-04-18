import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/theme/app_theme.dart';

class SearchHeader extends StatelessWidget {
  const SearchHeader({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
    required this.onClear,
    super.key,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: back button + title
          Row(
            children: [
              MotionPressable(
                onTap: () => context.pop(),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6), // gray-100
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Icon(
                    Icons.arrow_back,
                    size: 20,
                    color: Color(0xFF4B5563), // gray-600
                  ),
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Find Destination',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Search input
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6), // gray-100
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                  spreadRadius: -1,
                ),
              ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                const Icon(
                  Icons.search,
                  size: 18,
                  color: Color(0xFF9CA3AF), // gray-400
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: controller,
                    focusNode: focusNode,
                    autofocus: true,
                    onChanged: onChanged,
                    style: const TextStyle(
                      fontSize: 15,
                      color: AppColors.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search country or region...',
                      hintStyle: const TextStyle(
                        color: Color(0xFF9CA3AF),
                        fontSize: 15,
                      ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                      filled: false,
                      isDense: true,
                      suffixIcon: ValueListenableBuilder<TextEditingValue>(
                        valueListenable: controller,
                        builder: (context, value, _) {
                          if (value.text.isEmpty) return const SizedBox.shrink();
                          return MotionPressable(
                            onTap: onClear,
                            child: const Padding(
                              padding: EdgeInsets.all(8),
                              child: Icon(
                                Icons.close,
                                size: 16,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
