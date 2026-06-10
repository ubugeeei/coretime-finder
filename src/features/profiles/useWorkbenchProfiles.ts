import type { Ref } from "vue";
import { onMounted, ref } from "vue";
import { deserializeMembers, serializeMembers } from "../../availability/memberSerialization";
import type { Member, MemberId } from "../../availability/coretimeTypes";
import { getCurrentInstantIsoString } from "../../availability/timeZoneMath";
import {
  decodeShareSnapshot,
  encodeShareSnapshot,
  readStoredProfiles,
  writeStoredProfiles,
} from "./workbenchPersistence";
import type { WorkbenchProfile, WorkbenchSnapshot } from "./workbenchPersistence";

type ProfileInput = {
  members: Ref<Member[]>;
  minParticipants: Ref<number>;
  referenceDate: Ref<string>;
  referenceTimeZone: Ref<string>;
  selectedMemberId: Ref<MemberId | undefined>;
};

/**
 * Owns local profile persistence and share URL restoration for the workbench.
 *
 * The composable mutates the same refs as the editor so loading a profile feels like replacing the
 * current working set rather than navigating to a separate document.
 */
export function useWorkbenchProfiles(input: ProfileInput) {
  const profiles: Ref<WorkbenchProfile[]> = ref([]);
  const profileName = ref("Working set");
  const selectedProfileId: Ref<string | undefined> = ref();
  const profileMessage = ref("");
  const shareUrl = ref("");

  onMounted(() => {
    profiles.value = readStoredProfiles();
    restoreShareSnapshot();
  });

  /** Saves the current working set under the active profile id or a new timestamp id. */
  function saveProfileMut(): void {
    const name = profileName.value.trim() || "Untitled profile";
    const id = selectedProfileId.value ?? `profile-${Date.now()}`;
    const profile: WorkbenchProfile = {
      id,
      name,
      snapshot: createSnapshot(),
      updatedAt: getCurrentInstantIsoString(),
    };
    profiles.value = [profile, ...profiles.value.filter((candidate) => candidate.id !== id)];
    selectedProfileId.value = id;
    profileName.value = name;
    profileMessage.value = "Profile saved locally.";
    writeStoredProfiles(profiles.value);
  }

  /** Leaves existing saved profiles untouched while preparing the form for a new profile name. */
  function newProfileMut(): void {
    selectedProfileId.value = undefined;
    profileName.value = "Working set";
    profileMessage.value = "Editing a new profile.";
  }

  /** Replaces the editable workbench with a previously saved local snapshot. */
  function loadProfileMut(profileId: string): void {
    const profile = profiles.value.find((candidate) => candidate.id === profileId);
    if (profile === undefined) {
      return;
    }

    applySnapshot(profile.snapshot);
    selectedProfileId.value = profile.id;
    profileName.value = profile.name;
    profileMessage.value = "Profile restored.";
  }

  /** Removes a local profile without touching the currently edited members. */
  function deleteProfileMut(profileId: string): void {
    profiles.value = profiles.value.filter((profile) => profile.id !== profileId);
    if (selectedProfileId.value === profileId) {
      selectedProfileId.value = undefined;
    }
    profileMessage.value = "Profile deleted.";
    writeStoredProfiles(profiles.value);
  }

  /** Generates a share URL that embeds only the current snapshot, not the local profile list. */
  function createShareUrlMut(): void {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("share", encodeShareSnapshot(createSnapshot()));
    shareUrl.value = url.toString();
    profileMessage.value = "Share URL generated.";
  }

  /** Copies the generated share URL when clipboard access is available. */
  async function copyShareUrlMut(): Promise<void> {
    createShareUrlMut();
    if (typeof navigator === "undefined" || navigator.clipboard === undefined) {
      profileMessage.value = "Profile URL ready.";
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl.value);
      profileMessage.value = "Profile URL copied.";
    } catch {
      profileMessage.value = "Profile URL ready.";
    }
  }

  function createSnapshot(): WorkbenchSnapshot {
    return {
      members: serializeMembers(input.members.value),
      minParticipants: input.minParticipants.value,
      referenceDate: input.referenceDate.value,
      referenceTimeZone: input.referenceTimeZone.value,
      version: 1,
    };
  }

  function applySnapshot(snapshot: WorkbenchSnapshot): void {
    input.members.value = deserializeMembers(snapshot.members);
    input.referenceDate.value = snapshot.referenceDate;
    input.referenceTimeZone.value = snapshot.referenceTimeZone;
    input.minParticipants.value = Math.min(
      Math.max(1, snapshot.minParticipants),
      Math.max(1, input.members.value.length),
    );
    input.selectedMemberId.value = input.members.value[0]?.id;
  }

  function restoreShareSnapshot(): void {
    if (typeof window === "undefined") {
      return;
    }

    const encoded = new URL(window.location.href).searchParams.get("share");
    const snapshot = encoded === null ? undefined : decodeShareSnapshot(encoded);
    if (snapshot !== undefined) {
      applySnapshot(snapshot);
      profileMessage.value = "Share URL restored.";
    }
  }

  return {
    copyShareUrlMut,
    createShareUrlMut,
    deleteProfileMut,
    loadProfileMut,
    newProfileMut,
    profileMessage,
    profileName,
    profiles,
    saveProfileMut,
    selectedProfileId,
    shareUrl,
  };
}
