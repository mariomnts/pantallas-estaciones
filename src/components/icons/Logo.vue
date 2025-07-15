<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="260"
    height="220"
    viewBox="0 0 260 220"
    fill="none"
    stroke-width="6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="15" y="20" width="230" height="140" rx="20" ry="20" stroke-width="8" />

    <line x1="45" y1="40" x2="165" y2="40" />
    <line x1="45" y1="55" x2="135" y2="55" />
    <line x1="45" y1="70" x2="155" y2="70" />

    <defs>
      <mask id="trainMask" maskUnits="userSpaceOnUse">
        <path d="M70 100 H185 Q210 115 185 130 H70 Z" fill="white" />
        <rect x="85" y="107" width="25" height="15" rx="2" ry="2" fill="black" stroke="none" />
        <rect x="120" y="107" width="25" height="15" rx="2" ry="2" fill="black" stroke="none" />
        <rect x="155" y="107" width="25" height="15" rx="2" ry="2" fill="black" stroke="none" />
      </mask>
    </defs>

    <path d="M70 100 H185 Q210 115 185 130 H70 Z" fill="currentColor" mask="url(#trainMask)" />
    <path d="M70 100 H185 Q210 115 185 130 H70 Z" fill="none" />

    <circle cx="95" cy="133" r="8" fill="currentColor" />
    <circle cx="125" cy="133" r="8" fill="currentColor" />
    <circle cx="155" cy="133" r="8" fill="currentColor" />

    <rect x="118" y="160" width="24" height="25" rx="4" ry="4" />
    <rect x="80" y="185" width="100" height="12" rx="3" ry="3" />
  </svg>
</template>

<style type="text/css"></style>
