import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sitePages, trackingPixels, SitePage, TrackingPixel } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export const sitePagesRouter = router({
  // Listar todas as páginas
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const pages = await db
      .select()
      .from(sitePages)
      .orderBy(desc(sitePages.updatedAt));
    
    return pages;
  }),

  // Obter uma página por ID
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [page] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, input.id));
      
      return page || null;
    }),

  // Obter uma página por slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [page] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.slug, input.slug));
      
      return page || null;
    }),

  // Criar nova página
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      template: z.string().optional(),
      blocks: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Garantir que o slug começa com /
      const slug = input.slug.startsWith('/') ? input.slug : `/${input.slug}`;
      
      const [result] = await db.insert(sitePages).values({
        name: input.name,
        slug,
        template: input.template || 'blank',
        blocks: input.blocks || '[]',
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        status: 'draft',
      });
      
      const [newPage] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, result.insertId));
      
      return newPage;
    }),

  // Atualizar página
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      slug: z.string().optional(),
      blocks: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      ogImage: z.string().optional(),
      settings: z.string().optional(),
      createVersion: z.boolean().optional(), // Se deve criar versão antes de salvar
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, createVersion, ...data } = input;
      
      // Se deve criar versão, salvar estado atual antes de atualizar
      if (createVersion) {
        const [currentPage] = await db
          .select()
          .from(sitePages)
          .where(eq(sitePages.id, id));
        
        if (currentPage) {
          // Obter último número de versão
          const [lastVersion] = await db
            .select({ maxVersion: sql<number>`MAX(${pageVersions.versionNumber})` })
            .from(pageVersions)
            .where(eq(pageVersions.pageId, id));
          
          const nextVersion = (lastVersion?.maxVersion || 0) + 1;
          
          // Criar versão
          await db.insert(pageVersions).values({
            pageId: id,
            blocks: currentPage.blocks,
            settings: currentPage.settings,
            versionNumber: nextVersion,
            changeDescription: 'Auto-save antes de alteração',
          });
        }
      }
      
      // Se slug foi alterado, garantir que começa com /
      if (data.slug) {
        data.slug = data.slug.startsWith('/') ? data.slug : `/${data.slug}`;
      }
      
      await db
        .update(sitePages)
        .set(data)
        .where(eq(sitePages.id, id));
      
      const [updatedPage] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, id));
      
      return updatedPage;
    }),

  // Publicar página
  publish: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(sitePages)
        .set({ 
          status: 'published',
          publishedAt: new Date(),
        })
        .where(eq(sitePages.id, input.id));
      
      const [page] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, input.id));
      
      return page;
    }),

  // Despublicar página
  unpublish: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(sitePages)
        .set({ status: 'draft' })
        .where(eq(sitePages.id, input.id));
      
      const [page] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, input.id));
      
      return page;
    }),

  // Duplicar página
  duplicate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [original] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, input.id));
      
      if (!original) {
        throw new Error('Página não encontrada');
      }
      
      // Gerar novo slug único
      const baseSlug = original.slug.replace(/(-copy-\d+)?$/, '');
      let newSlug = `${baseSlug}-copy`;
      let counter = 1;
      
      // Verificar se o slug já existe
      while (true) {
        const [existing] = await db
          .select()
          .from(sitePages)
          .where(eq(sitePages.slug, newSlug));
        
        if (!existing) break;
        newSlug = `${baseSlug}-copy-${counter}`;
        counter++;
      }
      
      const [result] = await db.insert(sitePages).values({
        name: `${original.name} (Cópia)`,
        slug: newSlug,
        template: original.template,
        blocks: original.blocks,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        ogImage: original.ogImage,
        settings: original.settings,
        status: 'draft',
      });
      
      const [newPage] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, result.insertId));
      
      return newPage;
    }),

  // Excluir página
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(sitePages)
        .where(eq(sitePages.id, input.id));
      
      return { success: true };
    }),

  // Alterar URL/slug
  updateSlug: adminProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const slug = input.slug.startsWith('/') ? input.slug : `/${input.slug}`;
      
      // Verificar se o slug já existe
      const [existing] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.slug, slug));
      
      if (existing && existing.id !== input.id) {
        throw new Error('Esta URL já está em uso');
      }
      
      await db
        .update(sitePages)
        .set({ slug })
        .where(eq(sitePages.id, input.id));
      
      const [page] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, input.id));
      
      return page;
    }),

  // Obter estatísticas gerais
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const pages = await db.select().from(sitePages);
    
    const totalPages = pages.length;
    const publishedPages = pages.filter((p: SitePage) => p.status === 'published').length;
    const totalViews = pages.reduce((sum: number, p: SitePage) => sum + (p.totalViews || 0), 0);
    const totalConversions = pages.reduce((sum: number, p: SitePage) => sum + (p.totalConversions || 0), 0);
    
    return {
      totalPages,
      publishedPages,
      totalViews,
      totalConversions,
    };
  }),

  // Incrementar visualização (para tracking)
  trackView: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(sitePages)
        .set({ 
          totalViews: sql`${sitePages.totalViews} + 1`
        })
        .where(eq(sitePages.slug, input.slug));
      
      return { success: true };
    }),

  // Incrementar conversão (para tracking)
  trackConversion: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(sitePages)
        .set({ 
          totalConversions: sql`${sitePages.totalConversions} + 1`
        })
        .where(eq(sitePages.slug, input.slug));
      
      return { success: true };
    }),
});

// Router para pixels de tracking
export const trackingPixelsRouter = router({
  // Listar todos os pixels
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const pixels = await db
      .select()
      .from(trackingPixels)
      .orderBy(desc(trackingPixels.createdAt));
    
    return pixels;
  }),

  // Obter pixel por ID
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [pixel] = await db
        .select()
        .from(trackingPixels)
        .where(eq(trackingPixels.id, input.id));
      
      return pixel || null;
    }),

  // Criar novo pixel
  create: adminProcedure
    .input(z.object({
      type: z.enum(['google_analytics', 'facebook_pixel', 'tiktok_pixel', 'google_ads', 'custom']),
      name: z.string().min(1),
      pixelId: z.string().optional(),
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
      settings: z.string().optional(),
      enabledEvents: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(trackingPixels).values({
        type: input.type,
        name: input.name,
        pixelId: input.pixelId,
        apiKey: input.apiKey,
        apiSecret: input.apiSecret,
        settings: input.settings,
        enabledEvents: input.enabledEvents,
        isActive: true,
      });
      
      const [newPixel] = await db
        .select()
        .from(trackingPixels)
        .where(eq(trackingPixels.id, result.insertId));
      
      return newPixel;
    }),

  // Atualizar pixel
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      pixelId: z.string().optional(),
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
      settings: z.string().optional(),
      enabledEvents: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      await db
        .update(trackingPixels)
        .set(data)
        .where(eq(trackingPixels.id, id));
      
      const [updatedPixel] = await db
        .select()
        .from(trackingPixels)
        .where(eq(trackingPixels.id, id));
      
      return updatedPixel;
    }),

  // Excluir pixel
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(trackingPixels)
        .where(eq(trackingPixels.id, input.id));
      
      return { success: true };
    }),

  // Toggle ativo/inativo
  toggleActive: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [pixel] = await db
        .select()
        .from(trackingPixels)
        .where(eq(trackingPixels.id, input.id));
      
      if (!pixel) {
        throw new Error('Pixel não encontrado');
      }
      
      await db
        .update(trackingPixels)
        .set({ isActive: !pixel.isActive })
        .where(eq(trackingPixels.id, input.id));
      
      const [updatedPixel] = await db
        .select()
        .from(trackingPixels)
        .where(eq(trackingPixels.id, input.id));
      
      return updatedPixel;
    }),

  // Obter pixels ativos (para frontend)
  getActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const pixels = await db
      .select()
      .from(trackingPixels)
      .where(eq(trackingPixels.isActive, true));
    
    // Retornar apenas informações públicas (sem API keys)
    return pixels.map((p: TrackingPixel) => ({
      id: p.id,
      type: p.type,
      pixelId: p.pixelId,
      enabledEvents: p.enabledEvents,
    }));
  }),
});


// Importar novas tabelas
import { abTests, abTestVariants, pageBlocks, pageAssets, pageVersions } from "../../drizzle/schema";

// Router para A/B Tests
export const abTestsRouter = router({
  // Listar todos os testes
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const tests = await db
      .select()
      .from(abTests)
      .orderBy(desc(abTests.createdAt));
    
    return tests;
  }),

  // Obter teste por ID com variantes
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [test] = await db
        .select()
        .from(abTests)
        .where(eq(abTests.id, input.id));
      
      if (!test) return null;
      
      const variants = await db
        .select()
        .from(abTestVariants)
        .where(eq(abTestVariants.testId, input.id));
      
      return { ...test, variants };
    }),

  // Criar novo teste A/B
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      originalPageId: z.number(),
      trafficSplit: z.number().min(0).max(100).default(50),
      goalType: z.enum(['conversion', 'click', 'time_on_page', 'scroll_depth']).default('conversion'),
      goalValue: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Obter página original
      const [originalPage] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, input.originalPageId));
      
      if (!originalPage) {
        throw new Error('Página original não encontrada');
      }
      
      // Criar o teste
      const [result] = await db.insert(abTests).values({
        name: input.name,
        description: input.description,
        originalPageId: input.originalPageId,
        trafficSplit: input.trafficSplit,
        goalType: input.goalType,
        goalValue: input.goalValue,
        status: 'draft',
      });
      
      const testId = result.insertId;
      
      // Criar variante de controle (original)
      await db.insert(abTestVariants).values({
        testId,
        name: 'Controle (Original)',
        isControl: true,
        blocks: originalPage.blocks,
        settings: originalPage.settings,
      });
      
      // Criar variante B (cópia para edição)
      await db.insert(abTestVariants).values({
        testId,
        name: 'Variante B',
        isControl: false,
        blocks: originalPage.blocks,
        settings: originalPage.settings,
      });
      
      const [newTest] = await db
        .select()
        .from(abTests)
        .where(eq(abTests.id, testId));
      
      return newTest;
    }),

  // Atualizar teste
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      trafficSplit: z.number().min(0).max(100).optional(),
      goalType: z.enum(['conversion', 'click', 'time_on_page', 'scroll_depth']).optional(),
      goalValue: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      await db
        .update(abTests)
        .set(data)
        .where(eq(abTests.id, id));
      
      const [test] = await db
        .select()
        .from(abTests)
        .where(eq(abTests.id, id));
      
      return test;
    }),

  // Iniciar teste
  start: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(abTests)
        .set({ 
          status: 'running',
          startedAt: new Date(),
        })
        .where(eq(abTests.id, input.id));
      
      const [test] = await db
        .select()
        .from(abTests)
        .where(eq(abTests.id, input.id));
      
      return test;
    }),

  // Pausar teste
  pause: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(abTests)
        .set({ status: 'paused' })
        .where(eq(abTests.id, input.id));
      
      const [test] = await db
        .select()
        .from(abTests)
        .where(eq(abTests.id, input.id));
      
      return test;
    }),

  // Finalizar teste e declarar vencedor
  finish: adminProcedure
    .input(z.object({ 
      id: z.number(),
      winnerId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(abTests)
        .set({ 
          status: 'completed',
          winnerId: input.winnerId,
          endedAt: new Date(),
        })
        .where(eq(abTests.id, input.id));
      
      const [test] = await db
        .select()
        .from(abTests)
        .where(eq(abTests.id, input.id));
      
      return test;
    }),

  // Aplicar variante vencedora à página original
  applyWinner: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [test] = await db
        .select()
        .from(abTests)
        .where(eq(abTests.id, input.id));
      
      if (!test || !test.winnerId) {
        throw new Error('Teste não tem vencedor definido');
      }
      
      const [winnerVariant] = await db
        .select()
        .from(abTestVariants)
        .where(eq(abTestVariants.id, test.winnerId));
      
      if (!winnerVariant) {
        throw new Error('Variante vencedora não encontrada');
      }
      
      // Aplicar blocos e configurações da variante vencedora à página original
      await db
        .update(sitePages)
        .set({
          blocks: winnerVariant.blocks,
          settings: winnerVariant.settings,
        })
        .where(eq(sitePages.id, test.originalPageId));
      
      return { success: true };
    }),

  // Excluir teste
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Excluir variantes primeiro
      await db
        .delete(abTestVariants)
        .where(eq(abTestVariants.testId, input.id));
      
      // Excluir teste
      await db
        .delete(abTests)
        .where(eq(abTests.id, input.id));
      
      return { success: true };
    }),

  // Atualizar variante
  updateVariant: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      blocks: z.string().optional(),
      settings: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      await db
        .update(abTestVariants)
        .set(data)
        .where(eq(abTestVariants.id, id));
      
      const [variant] = await db
        .select()
        .from(abTestVariants)
        .where(eq(abTestVariants.id, id));
      
      return variant;
    }),

  // Registrar impressão (para tracking)
  trackImpression: publicProcedure
    .input(z.object({ variantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(abTestVariants)
        .set({ 
          impressions: sql`${abTestVariants.impressions} + 1`
        })
        .where(eq(abTestVariants.id, input.variantId));
      
      return { success: true };
    }),

  // Registrar conversão (para tracking)
  trackConversion: publicProcedure
    .input(z.object({ variantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(abTestVariants)
        .set({ 
          conversions: sql`${abTestVariants.conversions} + 1`
        })
        .where(eq(abTestVariants.id, input.variantId));
      
      return { success: true };
    }),

  // Obter variante para exibição (baseado no split de tráfego)
  getVariantForVisitor: publicProcedure
    .input(z.object({ 
      testId: z.number(),
      visitorId: z.string(), // Cookie ou fingerprint do visitante
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [test] = await db
        .select()
        .from(abTests)
        .where(eq(abTests.id, input.testId));
      
      if (!test || test.status !== 'running') {
        return null;
      }
      
      const variants = await db
        .select()
        .from(abTestVariants)
        .where(eq(abTestVariants.testId, input.testId));
      
      if (variants.length < 2) return null;
      
      // Usar hash do visitorId para determinar variante de forma consistente
      const hash = input.visitorId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const percentage = Math.abs(hash) % 100;
      const showVariant = percentage < (test.trafficSplit || 50);
      
      // Controle = false, Variante = true
      const selectedVariant = variants.find(v => showVariant ? !v.isControl : v.isControl);
      
      return selectedVariant || variants[0];
    }),
});

// Router para Page Blocks
export const pageBlocksRouter = router({
  // Listar blocos de uma página
  list: adminProcedure
    .input(z.object({ pageId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const blocks = await db
        .select()
        .from(pageBlocks)
        .where(eq(pageBlocks.pageId, input.pageId))
        .orderBy(pageBlocks.order);
      
      return blocks;
    }),

  // Criar novo bloco
  create: adminProcedure
    .input(z.object({
      pageId: z.number(),
      blockType: z.string(),
      blockId: z.string(),
      order: z.number().default(0),
      content: z.string().optional(),
      delay: z.number().default(0),
      animation: z.string().optional(),
      animationDuration: z.number().default(500),
      videoSync: z.boolean().default(false),
      videoTimestamp: z.number().optional(),
      videoId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(pageBlocks).values(input);
      
      const [block] = await db
        .select()
        .from(pageBlocks)
        .where(eq(pageBlocks.id, result.insertId));
      
      return block;
    }),

  // Atualizar bloco
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      content: z.string().optional(),
      delay: z.number().optional(),
      animation: z.string().optional(),
      animationDuration: z.number().optional(),
      videoSync: z.boolean().optional(),
      videoTimestamp: z.number().optional(),
      videoId: z.string().optional(),
      isVisible: z.boolean().optional(),
      visibilityCondition: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      await db
        .update(pageBlocks)
        .set(data)
        .where(eq(pageBlocks.id, id));
      
      const [block] = await db
        .select()
        .from(pageBlocks)
        .where(eq(pageBlocks.id, id));
      
      return block;
    }),

  // Reordenar blocos
  reorder: adminProcedure
    .input(z.object({
      pageId: z.number(),
      blockIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      for (let i = 0; i < input.blockIds.length; i++) {
        await db
          .update(pageBlocks)
          .set({ order: i })
          .where(eq(pageBlocks.id, input.blockIds[i]));
      }
      
      return { success: true };
    }),

  // Excluir bloco
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(pageBlocks)
        .where(eq(pageBlocks.id, input.id));
      
      return { success: true };
    }),
});

// Router para Page Assets (Biblioteca de Mídia)
export const pageAssetsRouter = router({
  // Listar todos os assets
  list: adminProcedure
    .input(z.object({ 
      pageId: z.number().optional(),
      type: z.enum(['image', 'video', 'icon', 'document', 'other']).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(pageAssets);
      
      if (input?.pageId) {
        query = query.where(eq(pageAssets.pageId, input.pageId)) as any;
      }
      
      if (input?.type) {
        query = query.where(eq(pageAssets.type, input.type)) as any;
      }
      
      const assets = await query.orderBy(desc(pageAssets.createdAt));
      
      return assets;
    }),

  // Upload de asset
  upload: adminProcedure
    .input(z.object({
      pageId: z.number().optional(),
      filename: z.string(),
      originalFilename: z.string().optional(),
      url: z.string(),
      type: z.enum(['image', 'video', 'icon', 'document', 'other']).default('image'),
      mimeType: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      fileSize: z.number().optional(),
      alt: z.string().optional(),
      caption: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(pageAssets).values(input);
      
      const [asset] = await db
        .select()
        .from(pageAssets)
        .where(eq(pageAssets.id, result.insertId));
      
      return asset;
    }),

  // Atualizar metadados do asset
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      alt: z.string().optional(),
      caption: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      await db
        .update(pageAssets)
        .set(data)
        .where(eq(pageAssets.id, id));
      
      const [asset] = await db
        .select()
        .from(pageAssets)
        .where(eq(pageAssets.id, id));
      
      return asset;
    }),

  // Excluir asset
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(pageAssets)
        .where(eq(pageAssets.id, input.id));
      
      return { success: true };
    }),
});

// Router para Page Versions (Histórico de versões)
export const pageVersionsRouter = router({
  // Listar versões de uma página
  list: adminProcedure
    .input(z.object({ pageId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const versions = await db
        .select()
        .from(pageVersions)
        .where(eq(pageVersions.pageId, input.pageId))
        .orderBy(desc(pageVersions.versionNumber));
      
      return versions;
    }),

  // Criar nova versão (snapshot)
  create: adminProcedure
    .input(z.object({
      pageId: z.number(),
      changeDescription: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Obter página atual
      const [page] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, input.pageId));
      
      if (!page) {
        throw new Error('Página não encontrada');
      }
      
      // Obter último número de versão
      const [lastVersion] = await db
        .select({ maxVersion: sql<number>`MAX(${pageVersions.versionNumber})` })
        .from(pageVersions)
        .where(eq(pageVersions.pageId, input.pageId));
      
      const nextVersion = (lastVersion?.maxVersion || 0) + 1;
      
      // Criar versão
      const [result] = await db.insert(pageVersions).values({
        pageId: input.pageId,
        blocks: page.blocks,
        settings: page.settings,
        versionNumber: nextVersion,
        changeDescription: input.changeDescription,
      });
      
      const [version] = await db
        .select()
        .from(pageVersions)
        .where(eq(pageVersions.id, result.insertId));
      
      return version;
    }),

  // Restaurar versão
  restore: adminProcedure
    .input(z.object({ 
      pageId: z.number(),
      versionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Obter versão
      const [version] = await db
        .select()
        .from(pageVersions)
        .where(eq(pageVersions.id, input.versionId));
      
      if (!version) {
        throw new Error('Versão não encontrada');
      }
      
      // Criar backup da versão atual antes de restaurar
      const [currentPage] = await db
        .select()
        .from(sitePages)
        .where(eq(sitePages.id, input.pageId));
      
      if (currentPage) {
        const [lastVersion] = await db
          .select({ maxVersion: sql<number>`MAX(${pageVersions.versionNumber})` })
          .from(pageVersions)
          .where(eq(pageVersions.pageId, input.pageId));
        
        await db.insert(pageVersions).values({
          pageId: input.pageId,
          blocks: currentPage.blocks,
          settings: currentPage.settings,
          versionNumber: (lastVersion?.maxVersion || 0) + 1,
          changeDescription: 'Backup antes de restaurar versão anterior',
        });
      }
      
      // Restaurar versão
      await db
        .update(sitePages)
        .set({
          blocks: version.blocks,
          settings: version.settings,
        })
        .where(eq(sitePages.id, input.pageId));
      
      return { success: true };
    }),
});
