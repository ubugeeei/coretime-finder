<script setup lang="ts">
import { computed, useId } from "vue";
import {
  mdiContentCopy,
  mdiContentSaveOutline,
  mdiDeleteOutline,
  mdiFolderOpenOutline,
  mdiLinkVariant,
  mdiPlus,
} from "@mdi/js";
import { useCoretimeContext } from "../workbench/coretimeContext";
import { eventStringValue } from "../../shared/forms/formEvents";
import type { WorkbenchProfile } from "./workbenchPersistence";

const {
  copyShareUrlMut,
  deleteProfileMut,
  loadProfileMut,
  newProfileMut,
  profileMessage,
  profileName,
  profiles,
  saveProfileMut,
  selectedProfileId,
  shareUrl,
} = useCoretimeContext();

const hasProfileMessage = computed<boolean>(() => profileMessage.value.length > 0);
const hasProfiles = computed<boolean>(() => profiles.value.length > 0);
const hasShareUrl = computed<boolean>(() => shareUrl.value.length > 0);
const copyIcon: string = mdiContentCopy;
const deleteIcon: string = mdiDeleteOutline;
const linkIcon: string = mdiLinkVariant;
const newIcon: string = mdiPlus;
const openIcon: string = mdiFolderOpenOutline;
const profileIndexes = computed<readonly number[]>(() => profiles.value.map((_, index) => index));
const profileMessageValue = computed<string>(() => profileMessage.value);
const profileNameId = useId();
const profileNameValue = computed<string>(() => profileName.value);
const profileShareUrlId = useId();
const profileShareUrlValue = computed<string>(() => shareUrl.value);
const profileTotalLabel = computed<string>(() => `${profiles.value.length} saved locally`);
const saveIcon: string = mdiContentSaveOutline;

function formatSavedAt(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function copyShareUrl(): void {
  void copyShareUrlMut();
}

function deleteProfile(index: number): void {
  deleteProfileMut(profileAt(index).id);
}

function loadProfile(index: number): void {
  loadProfileMut(profileAt(index).id);
}

function newProfile(): void {
  newProfileMut();
}

function profileAt(index: number): WorkbenchProfile {
  const profile = profiles.value[index];
  if (profile === undefined) {
    throw new Error(`Missing profile at ${index}.`);
  }

  return profile;
}

function profileDeleteLabelAt(index: number): string {
  return `Delete ${profileNameAt(index)}`;
}

function profileIdAt(index: number): string {
  return profileAt(index).id;
}

function profileIsSelectedAt(index: number): boolean {
  return profileIdAt(index) === selectedProfileId.value;
}

function profileNameAt(index: number): string {
  return profileAt(index).name;
}

function profileSavedAt(index: number): string {
  return formatSavedAt(profileAt(index).updatedAt);
}

function saveProfile(): void {
  saveProfileMut();
}

function updateProfileName(event: Event): void {
  profileName.value = eventStringValue(event);
}
</script>

<template>
  <section class="profile-panel" aria-label="Profiles and sharing">
    <div class="profile-heading">
      <div>
        <p class="profile-title">Profiles</p>
        <span class="profile-count">{{ profileTotalLabel }}</span>
      </div>
      <span v-if="hasProfileMessage" class="profile-message">{{ profileMessageValue }}</span>
    </div>

    <div class="profile-tools">
      <div class="field profile-name">
        <label :for="profileNameId">Name</label>
        <input
          :id="profileNameId"
          :value="profileNameValue"
          autocomplete="off"
          @input="updateProfileName"
        />
      </div>
      <div class="profile-actions">
        <button class="button primary" type="button" @click="saveProfile">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="saveIcon" />
          </svg>
          Save profile
        </button>
        <button class="button secondary" type="button" @click="newProfile">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="newIcon" />
          </svg>
          New
        </button>
        <button class="button secondary" type="button" @click="copyShareUrl">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="linkIcon" />
          </svg>
          Copy profile URL
        </button>
      </div>
    </div>

    <div v-if="hasShareUrl" class="share-field">
      <div class="share-label">
        <label class="share-url-label" :for="profileShareUrlId">Profile share URL</label>
        <span class="share-note">Current profile only. Saved profiles remain local.</span>
      </div>
      <div class="share-row">
        <input :id="profileShareUrlId" :value="profileShareUrlValue" readonly />
        <button class="button secondary" type="button" @click="copyShareUrl">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="copyIcon" />
          </svg>
          Copy
        </button>
      </div>
    </div>

    <div v-if="hasProfiles" class="profile-list">
      <div
        v-for="index in profileIndexes"
        :key="profileIdAt(index)"
        class="profile-item"
        :class="{ selected: profileIsSelectedAt(index) }"
      >
        <button class="profile-load-button" type="button" @click="loadProfile(index)">
          <svg class="profile-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="openIcon" />
          </svg>
          <strong class="profile-item-name">{{ profileNameAt(index) }}</strong>
          <small class="profile-item-date">{{ profileSavedAt(index) }}</small>
        </button>
        <button
          class="delete-button"
          type="button"
          :aria-label="profileDeleteLabelAt(index)"
          @click="deleteProfile(index)"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="deleteIcon" />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped src="./ProfileControls.css"></style>
