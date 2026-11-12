<script lang="ts">
  // Miniature d'une photo, lue dans la base seulement quand elle est affichée.
  import { db } from '../db/db';

  let { photoId }: { photoId: string } = $props();

  let url = $state('');
  $effect(() => {
    const id = photoId;
    url = '';
    if (!id) return;
    let annule = false;
    let cree = '';
    db.photoThumbs.get(id).then((ligne) => {
      if (annule || !ligne) return;
      cree = URL.createObjectURL(ligne.blob);
      url = cree;
    });
    return () => {
      annule = true;
      if (cree) URL.revokeObjectURL(cree);
    };
  });
</script>

{#if url}<img src={url} alt="" loading="lazy" decoding="async" />{/if}

<style>
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
