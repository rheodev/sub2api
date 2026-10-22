<template>
<section v-show="activeTab === 'backup'" class="settings-section space-y-6">
<div>
          <BackupSettings />
        </div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { systemSettingsComponents } from '../../useSystemSettings'
import { useSystemSettingsContext } from '../context'

export default defineComponent({
  name: 'SettingsBackupSection',
  components: systemSettingsComponents,
  setup() { return useSystemSettingsContext() },
})
</script>
