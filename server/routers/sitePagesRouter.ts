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
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
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
