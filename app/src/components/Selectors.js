import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { colors, spacing, radius } from '../theme';

export const ConditionSelector = ({ value, onChange, lang = 'nl', t }) => {
  const options = [
    { id: 'good', label: t('common.good', lang), icon: '✅' },
    { id: 'mixed', label: t('common.mixed', lang), icon: '⚠️' },
    { id: 'damaged', label: t('common.damaged', lang), icon: '❌' },
  ];

  return (
    <View style={styles.container}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.chip, value === opt.id && styles.activeChip]}
          onPress={() => onChange(opt.id)}
        >
          <Text style={[styles.text, value === opt.id && styles.activeText]}>
            {opt.icon} {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const ProductTypeSelector = ({ value, onChange, options = [] }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton, value && styles.dropdownButtonActive]}
        onPress={() => setShowDropdown(true)}
      >
        <Text style={[styles.dropdownButtonText, !value && styles.dropdownButtonPlaceholder]}>
          {value || 'Select product type...'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Product Type</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Text style={styles.dropdownClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {options.map((option, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dropdownItem,
                    value === option && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    onChange(option);
                    setShowDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      value === option && styles.dropdownItemTextActive
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const LocationSelector = ({ value, onChange, locations = [] }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const selectedLocation = locations.find(loc => loc.location_id === value);

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton, value && styles.dropdownButtonActive]}
        onPress={() => setShowDropdown(true)}
      >
        <Text style={[styles.dropdownButtonText, !value && styles.dropdownButtonPlaceholder]}>
          {selectedLocation?.label || 'Select a location...'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Text style={styles.dropdownClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {locations.map((location) => (
                <TouchableOpacity
                  key={location.location_id}
                  style={[
                    styles.dropdownItem,
                    value === location.location_id && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    onChange(location.location_id);
                    setShowDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      value === location.location_id && styles.dropdownItemTextActive
                    ]}
                  >
                    {location.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const UnitSelector = ({ value, onChange }) => {
  const units = [
    { label: 'kg', value: 'kg' },
    { label: 'Crates', value: 'crates' },
    { label: 'Units', value: 'units' },
    { label: 'Boxes', value: 'boxes' },
  ];

  return (
    <View style={styles.unitContainer}>
      {units.map((unit) => (
        <TouchableOpacity
          key={unit.value}
          style={[styles.unitChip, value === unit.value && styles.unitChipActive]}
          onPress={() => onChange(unit.value)}
        >
          <Text style={[styles.unitText, value === unit.value && styles.unitTextActive]}>
            {unit.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const StatusBadge = ({ status, lang = 'nl', t }) => {
  const statusColors = {
    confirmed: { bg: '#E8F5E9', text: colors.success },
    pending: { bg: '#FFF3E0', text: colors.warning },
    flagged: { bg: '#FFEBEE', text: colors.error },
    rejected: { bg: '#F5F5F5', text: colors.gray600 },
  };

  const statusStyle = statusColors[status] || statusColors.rejected;
  const label = t(`common.${status}`, lang) || status;

  return (
    <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
      <Text style={[styles.badgeText, { color: statusStyle.text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  activeChip: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  text: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  dropdownButtonActive: {
    borderColor: colors.primary,
    backgroundColor: '#F5F5F5',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  dropdownButtonPlaceholder: {
    color: colors.text.tertiary,
    fontWeight: '400',
  },
  dropdownArrow: {
    color: colors.text.secondary,
    fontSize: 12,
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dropdownModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    paddingTop: spacing.md,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dropdownClose: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  dropdownList: {
    paddingHorizontal: spacing.lg,
  },
  dropdownItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unitContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  unitChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  unitChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  unitText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  unitTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});

