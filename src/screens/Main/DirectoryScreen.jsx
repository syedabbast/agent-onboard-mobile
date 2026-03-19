import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import AgentAvatar from '../../components/AgentAvatar';
import EmptyState from '../../components/EmptyState';
import * as haptics from '../../lib/haptics';

const FILTER_TYPES = ['all', 'human', 'ai', 'tool', 'hybrid'];

export default function DirectoryScreen({ navigation }) {
  const [agents, setAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAgents = useCallback(async () => {
    try {
      let query = supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('agent_type', filterType);
      }

      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery.trim()}%,company.ilike.%${searchQuery.trim()}%`
        );
      }

      const { data } = await query;
      setAgents(data || []);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAgents();
    setRefreshing(false);
  }, [fetchAgents]);

  function renderAgentCard({ item }) {
    return (
      <TouchableOpacity
        style={styles.agentCard}
        onPress={() => {
          haptics.light();
          navigation.navigate('Connect', { token: item.share_token });
        }}
        activeOpacity={0.7}
      >
        <AgentAvatar
          name={item.name}
          size={48}
          agentType={item.agent_type}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.company ? (
            <Text style={styles.cardCompany} numberOfLines={1}>
              {item.company}
            </Text>
          ) : null}
          <View style={styles.cardTags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {item.agent_type?.toUpperCase()}
              </Text>
            </View>
            {item.platform ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {item.platform.toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={styles.arrow}>{'>'}</Text>
      </TouchableOpacity>
    );
  }

  const listHeader = (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>AGENT DIRECTORY</Text>
        <Text style={styles.headerTitle}>Find Agents</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search agents by name or company..."
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTER_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              filterType === type && styles.filterChipActive,
            ]}
            onPress={() => {
              haptics.selection();
              setFilterType(type);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === type && styles.filterChipTextActive,
              ]}
            >
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        renderItem={renderAgentCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              emoji="🔍"
              title="No Agents Found"
              subtitle="Try adjusting your search or filters"
            />
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.navy}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLabel: {
    ...FONTS.label,
    color: COLORS.amber,
    letterSpacing: 3,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    ...FONTS.display,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  searchInput: {
    ...FONTS.body,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: COLORS.white,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  filterChipText: {
    ...FONTS.label,
    fontSize: 10,
    color: COLORS.muted,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    ...FONTS.heading,
    fontSize: 16,
  },
  cardCompany: {
    ...FONTS.caption,
    marginTop: 1,
  },
  cardTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  tag: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  tagText: {
    ...FONTS.label,
    fontSize: 9,
    color: COLORS.muted,
  },
  arrow: {
    ...FONTS.heading,
    color: COLORS.muted,
    fontSize: 18,
  },
});
