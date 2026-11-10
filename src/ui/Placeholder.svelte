<script lang="ts">
  // Écran provisoire, en attendant la fonctionnalité.
  let { icon, title, text }: { icon: string; title: string; text: string } = $props();
</script>

<section class="vide">
  <div class="icone" aria-hidden="true">{icon}</div>
  <h1>{title}</h1>
  <p>{text}</p>
</section>

<style>
  .vide {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 60vh;
    padding: 24px;
    gap: 8px;
  }
  .icone {
    font-size: 4rem;
  }
  p {
    color: var(--texte-doux);
    max-width: 32ch;
  }
</style>
