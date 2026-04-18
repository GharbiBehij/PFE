import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:esim_frontend/core/motion/widgets/motion_page_enter.dart';
import 'package:esim_frontend/core/motion/widgets/motion_pressable.dart';
import 'package:esim_frontend/core/motion/widgets/motion_stagger_list.dart';
import 'package:esim_frontend/core/router/route_names.dart';
import 'package:esim_frontend/core/widgets/country_flag.dart';
import 'package:esim_frontend/features/esims/data/models/esim_model.dart';
import 'package:esim_frontend/features/esims/presentation/providers/esims_provider.dart';

enum _EsimTab { active, history }

const _browseToSearchHeroTag = 'browse_to_search_bar_hero';

Widget _searchBarHeroShuttle(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection direction,
  BuildContext fromHeroContext,
  BuildContext toHeroContext,
) {
  final targetHero =
      (direction == HeroFlightDirection.push
              ? toHeroContext.widget
              : fromHeroContext.widget)
          as Hero;

  return FadeTransition(
    opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
    child: targetHero.child,
  );
}

class MyEsimsScreen extends ConsumerStatefulWidget {
  const MyEsimsScreen({super.key});

  @override
  ConsumerState<MyEsimsScreen> createState() => _MyEsimsScreenState();
}

class _MyEsimsScreenState extends ConsumerState<MyEsimsScreen> {
  _EsimTab _activeTab = _EsimTab.active;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(esimsProvider);

    ref.listen<EsimsState>(esimsProvider, (previous, next) {
      next.maybeWhen(
        error: (message) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
        },
        orElse: () {},
      );
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: MotionPageEnter(
        child: state.when(
          initial: () => const _LoadingView(),
          loading: () => const _LoadingView(),
          error: (message) => _ErrorView(
            message: message,
            onRetry: () => ref.read(esimsProvider.notifier).fetchEsims(),
          ),
          loaded: (esims) => _LoadedView(
            activeTab: _activeTab,
            activeEsims: _activeEsims(esims),
            historyEsims: _historyEsims(esims),
            onTabChanged: (tab) => setState(() => _activeTab = tab),
            onRefresh: () => ref.read(esimsProvider.notifier).refresh(),
          ),
        ),
      ),
    );
  }

  List<EsimModel> _activeEsims(List<EsimModel> input) {
    return input
        .where(
          (item) =>
              item.status == EsimStatus.active ||
              item.status == EsimStatus.pending,
        )
        .toList(growable: false);
  }

  List<EsimModel> _historyEsims(List<EsimModel> input) {
    return input
        .where(
          (item) =>
              item.status == EsimStatus.expired ||
              item.status == EsimStatus.deleted,
        )
        .toList(growable: false);
  }
}

class _LoadedView extends StatelessWidget {
  const _LoadedView({
    required this.activeTab,
    required this.activeEsims,
    required this.historyEsims,
    required this.onTabChanged,
    required this.onRefresh,
  });

  final _EsimTab activeTab;
  final List<EsimModel> activeEsims;
  final List<EsimModel> historyEsims;
  final ValueChanged<_EsimTab> onTabChanged;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final list = activeTab == _EsimTab.active ? activeEsims : historyEsims;

    return Column(
      children: [
        _Header(activeTab: activeTab, onTabChanged: onTabChanged),
        Expanded(
          child: RefreshIndicator(
            onRefresh: onRefresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
              children: [
                if (list.isEmpty)
                  _EmptyState(
                    isActiveTab: activeTab == _EsimTab.active,
                    onBrowse: () => context.push(RouteNames.search),
                  )
                else
                  MotionStaggerList(
                    children: [
                      for (var i = 0; i < list.length; i++)
                        Padding(
                          padding: EdgeInsets.only(
                            bottom: i == list.length - 1 ? 0 : 18,
                          ),
                          child: _EsimCard(
                            esim: list[i],
                            index: i,
                            onManage: () =>
                                context.push(RouteNames.esimDetail(list[i].id)),
                          ),
                        ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.activeTab, required this.onTabChanged});

  final _EsimTab activeTab;
  final ValueChanged<_EsimTab> onTabChanged;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;

    return Container(
      padding: EdgeInsets.fromLTRB(24, top + 12, 24, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'My eSIMs',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ),
              MotionPressable(
                onTap: () {},
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Icon(
                    Icons.settings,
                    color: Color(0xFF4B5563),
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(14),
            ),
            padding: const EdgeInsets.all(4),
            child: Row(
              children: [
                _TabButton(
                  text: 'Active Plans',
                  active: activeTab == _EsimTab.active,
                  onTap: () => onTabChanged(_EsimTab.active),
                ),
                _TabButton(
                  text: 'History',
                  active: activeTab == _EsimTab.history,
                  onTap: () => onTabChanged(_EsimTab.history),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.text,
    required this.active,
    required this.onTap,
  });

  final String text;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MotionPressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOutCubic,
        height: 40,
        width: (MediaQuery.of(context).size.width - 56) / 2,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.07),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: active ? const Color(0xFF7C3AED) : const Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF7C3AED)),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.wifi_off_rounded,
              size: 42,
              color: Color(0xFF6B7280),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF6B7280), fontSize: 14),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onBrowse, required this.isActiveTab});

  final VoidCallback onBrowse;
  final bool isActiveTab;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(999),
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.public, color: Color(0xFF9CA3AF), size: 30),
          ),
          const SizedBox(height: 16),
          Text(
            isActiveTab ? 'No active plans' : 'No history yet',
            style: const TextStyle(
              fontSize: 20,
              color: Color(0xFF1F2937),
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isActiveTab
                ? 'You do not have any active eSIMs right now.'
                : 'Your expired plans will appear here.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
          ),
          if (isActiveTab) ...[
            const SizedBox(height: 18),
            MotionPressable(
              onTap: onBrowse,
              child: Hero(
                tag: _browseToSearchHeroTag,
                flightShuttleBuilder: _searchBarHeroShuttle,
                child: Material(
                  color: Colors.transparent,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7C3AED),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Browse Packages',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _EsimCard extends StatelessWidget {
  const _EsimCard({
    required this.esim,
    required this.index,
    required this.onManage,
  });

  final EsimModel esim;
  final int index;
  final VoidCallback onManage;

  static const _activeGradients = [
    [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
    [Color(0xFF7C3AED), Color(0xFF4338CA)],
  ];

  bool get _isExpired =>
      esim.status == EsimStatus.expired || esim.status == EsimStatus.deleted;

  List<Color> get _cardColors {
    if (_isExpired) {
      return const [Color(0xFF9CA3AF), Color(0xFF6B7280)];
    }
    return _activeGradients[index % _activeGradients.length];
  }

  int get _usagePercent {
    if (esim.dataTotal <= 0) return 0;
    return ((esim.dataUsed / esim.dataTotal) * 100).round().clamp(0, 100);
  }

  int _daysRemaining() {
    final exp = esim.expiresAt;
    if (exp == null) return 0;
    final days = exp.difference(DateTime.now()).inDays;
    return days > 0 ? days : 0;
  }

  String get _expiryText {
    if (esim.expiresAt == null) return '-';
    return DateFormat('MMM d, yyyy').format(esim.expiresAt!.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final isPending = esim.status == EsimStatus.pending;

    final statusText = _isExpired
        ? 'Expired'
        : (isPending ? 'Pending' : 'Connected');

    final statusSignalColor = _isExpired
        ? const Color(0xFFD1D5DB)
        : (isPending ? const Color(0xFFFACC15) : const Color(0xFF86EFAC));

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          colors: _cardColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            Positioned(
              top: -20,
              right: -10,
              child: Icon(
                Icons.public,
                size: 130,
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.12),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.signal_cellular_alt_rounded,
                              size: 12,
                              color: statusSignalColor,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              statusText,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      MotionPressable(
                        onTap: () {},
                        child: const Icon(
                          Icons.more_vert,
                          color: Colors.white70,
                          size: 20,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      CountryFlag(
                        countryCode: esim.offer.countryCode,
                        size: FlagSize.lg,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          esim.offer.country,
                          style: const TextStyle(
                            fontSize: 34,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            height: 1,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (!_isExpired) ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_rounded,
                          size: 14,
                          color: Colors.white70,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${_daysRemaining()} days left',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '• Expires $_expiryText',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    const SizedBox(height: 10),
                    Text(
                      'Expired on $_expiryText',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.12),
                      ),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.storage_rounded,
                              size: 16,
                              color: Colors.white70,
                            ),
                            const SizedBox(width: 8),
                            const Expanded(
                              child: Text(
                                'Data Usage',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                '$_usagePercent% used',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(999),
                          child: Container(
                            height: 10,
                            color: Colors.black.withValues(alpha: 0.2),
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: FractionallySizedBox(
                                widthFactor: _usagePercent / 100,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: _isExpired
                                        ? const Color(0xFF9CA3AF)
                                        : (_usagePercent > 80
                                              ? const Color(0xFFFACC15)
                                              : Colors.white),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _UsageCol(
                              label: 'Used',
                              value: esim.formattedDataUsed,
                            ),
                            _UsageCol(
                              label: 'Remaining',
                              value: esim.formattedDataRemaining,
                              center: true,
                            ),
                            _UsageCol(
                              label: 'Total',
                              value: esim.formattedDataTotal,
                              alignEnd: true,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerRight,
                    child: MotionPressable(
                      onTap: onManage,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.22),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.12),
                          ),
                        ),
                        child: const Text(
                          'Manage',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UsageCol extends StatelessWidget {
  const _UsageCol({
    required this.label,
    required this.value,
    this.center = false,
    this.alignEnd = false,
  });

  final String label;
  final String value;
  final bool center;
  final bool alignEnd;

  @override
  Widget build(BuildContext context) {
    final cross = alignEnd
        ? CrossAxisAlignment.end
        : (center ? CrossAxisAlignment.center : CrossAxisAlignment.start);

    return Expanded(
      child: Column(
        crossAxisAlignment: cross,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: Colors.white70),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
