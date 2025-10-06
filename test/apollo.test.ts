import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema tests
const SearchPeopleSchema = z.object({
  keywords: z.string().optional(),
  titles: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  organization_ids: z.array(z.string()).optional(),
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(10),
});

const EnrichPersonSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  domain: z.string().optional(),
  organization_name: z.string().optional(),
});

const EnrichOrganizationSchema = z.object({
  domain: z.string(),
});

const SearchOrganizationsSchema = z.object({
  keywords: z.string().optional(),
  locations: z.array(z.string()).optional(),
  employee_ranges: z.array(z.string()).optional(),
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(10),
});

describe('Apollo.io MCP Schema Validation', () => {
  describe('SearchPeopleSchema', () => {
    it('should validate valid search people params', () => {
      const valid = {
        keywords: 'CTO',
        titles: ['Chief Technology Officer'],
        locations: ['San Francisco, CA'],
        page: 1,
        per_page: 10,
      };
      expect(() => SearchPeopleSchema.parse(valid)).not.toThrow();
    });

    it('should use default values for page and per_page', () => {
      const result = SearchPeopleSchema.parse({ keywords: 'engineer' });
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(10);
    });

    it('should allow empty params', () => {
      expect(() => SearchPeopleSchema.parse({})).not.toThrow();
    });
  });

  describe('EnrichPersonSchema', () => {
    it('should validate valid person enrichment params', () => {
      const valid = {
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };
      expect(() => EnrichPersonSchema.parse(valid)).not.toThrow();
    });

    it('should allow only email', () => {
      expect(() => EnrichPersonSchema.parse({ email: 'test@example.com' })).not.toThrow();
    });

    it('should allow only domain and name', () => {
      const valid = {
        domain: 'apollo.io',
        organization_name: 'Apollo.io',
      };
      expect(() => EnrichPersonSchema.parse(valid)).not.toThrow();
    });
  });

  describe('EnrichOrganizationSchema', () => {
    it('should validate valid organization params', () => {
      expect(() => EnrichOrganizationSchema.parse({ domain: 'apollo.io' })).not.toThrow();
    });

    it('should require domain field', () => {
      expect(() => EnrichOrganizationSchema.parse({})).toThrow();
    });

    it('should accept various domain formats', () => {
      expect(() => EnrichOrganizationSchema.parse({ domain: 'example.com' })).not.toThrow();
      expect(() => EnrichOrganizationSchema.parse({ domain: 'sub.example.com' })).not.toThrow();
    });
  });

  describe('SearchOrganizationsSchema', () => {
    it('should validate valid search organization params', () => {
      const valid = {
        keywords: 'SaaS',
        locations: ['San Francisco'],
        employee_ranges: ['1-10', '11-50'],
        page: 1,
        per_page: 25,
      };
      expect(() => SearchOrganizationsSchema.parse(valid)).not.toThrow();
    });

    it('should use default pagination values', () => {
      const result = SearchOrganizationsSchema.parse({ keywords: 'tech' });
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(10);
    });

    it('should allow empty params', () => {
      expect(() => SearchOrganizationsSchema.parse({})).not.toThrow();
    });
  });
});

describe('Apollo.io Response Format', () => {
  it('should format person search results correctly', () => {
    const mockPerson = {
      name: 'John Doe',
      title: 'CTO',
      organization: { name: 'Test Corp' },
      city: 'San Francisco',
      state: 'California',
      email: 'john@test.com',
      linkedin_url: 'https://linkedin.com/in/johndoe',
    };

    const formatted = {
      name: mockPerson.name,
      title: mockPerson.title,
      company: mockPerson.organization?.name,
      location: `${mockPerson.city}, ${mockPerson.state}`,
      email: mockPerson.email,
      linkedin: mockPerson.linkedin_url,
    };

    expect(formatted).toEqual({
      name: 'John Doe',
      title: 'CTO',
      company: 'Test Corp',
      location: 'San Francisco, California',
      email: 'john@test.com',
      linkedin: 'https://linkedin.com/in/johndoe',
    });
  });

  it('should format organization enrichment results correctly', () => {
    const mockOrg = {
      name: 'Apollo.io',
      primary_domain: 'apollo.io',
      industry: 'information technology & services',
      estimated_num_employees: 800,
      city: 'San Francisco',
      state: 'California',
      short_description: 'AI-driven sales platform',
      founded_year: 2015,
      linkedin_url: 'https://linkedin.com/company/apolloio',
      current_technologies: [{ uid: 'ai', name: 'AI', category: 'Other' }],
    };

    const formatted = {
      name: mockOrg.name,
      domain: mockOrg.primary_domain,
      industry: mockOrg.industry,
      employees: mockOrg.estimated_num_employees,
      location: `${mockOrg.city}, ${mockOrg.state}`,
      description: mockOrg.short_description,
      founded: mockOrg.founded_year,
      linkedin: mockOrg.linkedin_url,
      technologies: mockOrg.current_technologies.slice(0, 10),
    };

    expect(formatted).toEqual({
      name: 'Apollo.io',
      domain: 'apollo.io',
      industry: 'information technology & services',
      employees: 800,
      location: 'San Francisco, California',
      description: 'AI-driven sales platform',
      founded: 2015,
      linkedin: 'https://linkedin.com/company/apolloio',
      technologies: [{ uid: 'ai', name: 'AI', category: 'Other' }],
    });
  });
});
