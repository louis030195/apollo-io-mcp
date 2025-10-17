#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

if (!APOLLO_API_KEY) {
  console.error("Error: APOLLO_API_KEY environment variable is required");
  console.error("Get your API key from: https://app.apollo.io/#/settings/integrations/api");
  process.exit(1);
}

class ApolloClient {
  private api: AxiosInstance;

  constructor(apiKey: string) {
    this.api = axios.create({
      baseURL: "https://api.apollo.io/v1",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
    });
  }

  async searchPeople(params: {
    q_keywords?: string;
    person_titles?: string[];
    person_locations?: string[];
    organization_ids?: string[];
    page?: number;
    per_page?: number;
  }) {
    const response = await this.api.post("/mixed_people/search", params);
    return response.data;
  }

  async enrichPerson(params: {
    first_name?: string;
    last_name?: string;
    email?: string;
    domain?: string;
    organization_name?: string;
  }) {
    const response = await this.api.post("/people/match", params);
    return response.data;
  }

  async enrichOrganization(domain: string) {
    const response = await this.api.post("/organizations/enrich", { domain });
    return response.data;
  }

  async searchOrganizations(params: {
    q_keywords?: string;
    organization_locations?: string[];
    organization_num_employees_ranges?: string[];
    page?: number;
    per_page?: number;
  }) {
    const response = await this.api.post("/mixed_companies/search", params);
    return response.data;
  }

  async searchSequences(params?: {
    name?: string;
    page?: number;
    per_page?: number;
  }) {
    const response = await this.api.post("/emailer_campaigns/search", params || {});
    return response.data;
  }

  async getEmailAccounts() {
    const response = await this.api.get("/email_accounts");
    return response.data;
  }

  async getEmailMessageActivities(messageId: string) {
    const response = await this.api.get(`/emailer_messages/${messageId}/activities`);
    return response.data;
  }
}

const SearchPeopleSchema = z.object({
  keywords: z.string().optional().describe("Keywords to search for (job title, company, etc)"),
  titles: z.array(z.string()).optional().describe("Array of job titles to filter by"),
  locations: z.array(z.string()).optional().describe("Array of locations to filter by"),
  organization_ids: z.array(z.string()).optional().describe("Array of organization IDs to filter by"),
  page: z.number().optional().default(1).describe("Page number for pagination"),
  per_page: z.number().optional().default(10).describe("Results per page (max 100)"),
});

const EnrichPersonSchema = z.object({
  first_name: z.string().optional().describe("Person's first name"),
  last_name: z.string().optional().describe("Person's last name"),
  email: z.string().optional().describe("Person's email address"),
  domain: z.string().optional().describe("Company domain (e.g., apollo.io)"),
  organization_name: z.string().optional().describe("Company name"),
});

const EnrichOrganizationSchema = z.object({
  domain: z.string().describe("Company domain (e.g., apollo.io)"),
});

const SearchOrganizationsSchema = z.object({
  keywords: z.string().optional().describe("Keywords to search for"),
  locations: z.array(z.string()).optional().describe("Array of locations to filter by"),
  employee_ranges: z.array(z.string()).optional().describe("Employee count ranges (e.g., ['1-10', '11-50'])"),
  page: z.number().optional().default(1).describe("Page number for pagination"),
  per_page: z.number().optional().default(10).describe("Results per page (max 100)"),
});

const SearchSequencesSchema = z.object({
  name: z.string().optional().describe("Sequence name to filter by"),
  page: z.number().optional().default(1).describe("Page number for pagination"),
  per_page: z.number().optional().default(25).describe("Results per page"),
});

const GetEmailMessageActivitiesSchema = z.object({
  message_id: z.string().describe("The emailer message ID to get activities for"),
});

async function main() {
  const client = new ApolloClient(APOLLO_API_KEY!);
  const server = new Server({
    name: "apollo-io-mcp",
    version: "0.1.0",
  }, {
    capabilities: {
      tools: {},
    },
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "apollo_search_people",
        description: "Search for people/prospects in Apollo's B2B database. Filter by job titles, locations, companies, etc.",
        inputSchema: {
          type: "object",
          properties: {
            keywords: {
              type: "string",
              description: "Keywords to search for (job title, company, etc)",
            },
            titles: {
              type: "array",
              items: { type: "string" },
              description: "Array of job titles to filter by",
            },
            locations: {
              type: "array",
              items: { type: "string" },
              description: "Array of locations to filter by",
            },
            organization_ids: {
              type: "array",
              items: { type: "string" },
              description: "Array of organization IDs to filter by",
            },
            page: {
              type: "number",
              description: "Page number for pagination",
              default: 1,
            },
            per_page: {
              type: "number",
              description: "Results per page (max 100)",
              default: 10,
            },
          },
        },
      },
      {
        name: "apollo_enrich_person",
        description: "Enrich a person's data with Apollo's B2B intelligence. Provide email, name, or company info.",
        inputSchema: {
          type: "object",
          properties: {
            first_name: {
              type: "string",
              description: "Person's first name",
            },
            last_name: {
              type: "string",
              description: "Person's last name",
            },
            email: {
              type: "string",
              description: "Person's email address",
            },
            domain: {
              type: "string",
              description: "Company domain (e.g., apollo.io)",
            },
            organization_name: {
              type: "string",
              description: "Company name",
            },
          },
        },
      },
      {
        name: "apollo_enrich_organization",
        description: "Enrich a company's data with Apollo's B2B intelligence using their domain.",
        inputSchema: {
          type: "object",
          properties: {
            domain: {
              type: "string",
              description: "Company domain (e.g., apollo.io)",
            },
          },
          required: ["domain"],
        },
      },
      {
        name: "apollo_search_organizations",
        description: "Search for companies/organizations in Apollo's B2B database. Filter by location, size, keywords, etc.",
        inputSchema: {
          type: "object",
          properties: {
            keywords: {
              type: "string",
              description: "Keywords to search for",
            },
            locations: {
              type: "array",
              items: { type: "string" },
              description: "Array of locations to filter by",
            },
            employee_ranges: {
              type: "array",
              items: { type: "string" },
              description: "Employee count ranges (e.g., ['1-10', '11-50'])",
            },
            page: {
              type: "number",
              description: "Page number for pagination",
              default: 1,
            },
            per_page: {
              type: "number",
              description: "Results per page (max 100)",
              default: 10,
            },
          },
        },
      },
      {
        name: "apollo_search_sequences",
        description: "Search for email sequences in your Apollo account. Returns sequence stats including sent, bounced, replied counts. Requires master API key.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Sequence name to filter by",
            },
            page: {
              type: "number",
              description: "Page number for pagination",
              default: 1,
            },
            per_page: {
              type: "number",
              description: "Results per page",
              default: 25,
            },
          },
        },
      },
      {
        name: "apollo_get_email_accounts",
        description: "Get list of email accounts connected to your Apollo account. Requires master API key.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "apollo_get_email_message_activities",
        description: "Get activities (opens, clicks, replies) for a specific email message sent via sequence. Requires master API key.",
        inputSchema: {
          type: "object",
          properties: {
            message_id: {
              type: "string",
              description: "The emailer message ID to get activities for",
            },
          },
          required: ["message_id"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    try {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "apollo_search_people": {
          const validated = SearchPeopleSchema.parse(args);

          const params: any = {
            page: validated.page,
            per_page: validated.per_page,
          };

          if (validated.keywords) params.q_keywords = validated.keywords;
          if (validated.titles) params.person_titles = validated.titles;
          if (validated.locations) params.person_locations = validated.locations;
          if (validated.organization_ids) params.organization_ids = validated.organization_ids;

          const result = await client.searchPeople(params);

          const people = result.people || [];
          const summary = people.slice(0, 5).map((p: any) => ({
            name: p.name,
            title: p.title,
            company: p.organization?.name,
            location: p.city && p.state ? `${p.city}, ${p.state}` : p.country,
            email: p.email,
            linkedin: p.linkedin_url,
          }));

          return {
            content: [
              {
                type: "text",
                text: `Found ${result.pagination?.total_entries || 0} people\n\n` +
                      `Top Results:\n${JSON.stringify(summary, null, 2)}\n\n` +
                      `Full data:\n${JSON.stringify(result, null, 2)}`,
              },
            ],
          };
        }

        case "apollo_enrich_person": {
          const validated = EnrichPersonSchema.parse(args);

          const params: any = {};
          if (validated.first_name) params.first_name = validated.first_name;
          if (validated.last_name) params.last_name = validated.last_name;
          if (validated.email) params.email = validated.email;
          if (validated.domain) params.domain = validated.domain;
          if (validated.organization_name) params.organization_name = validated.organization_name;

          const result = await client.enrichPerson(params);

          const person = result.person;
          if (!person) {
            return {
              content: [
                {
                  type: "text",
                  text: "No person found with the provided information.",
                },
              ],
            };
          }

          const summary = {
            name: person.name,
            title: person.title,
            company: person.organization?.name,
            email: person.email,
            phone: person.phone_numbers?.[0]?.sanitized_number,
            linkedin: person.linkedin_url,
            location: person.city && person.state ? `${person.city}, ${person.state}` : person.country,
          };

          return {
            content: [
              {
                type: "text",
                text: `Person Enrichment:\n\n` +
                      `${JSON.stringify(summary, null, 2)}\n\n` +
                      `Full data:\n${JSON.stringify(result, null, 2)}`,
              },
            ],
          };
        }

        case "apollo_enrich_organization": {
          const { domain } = EnrichOrganizationSchema.parse(args);

          const result = await client.enrichOrganization(domain);

          const org = result.organization;
          if (!org) {
            return {
              content: [
                {
                  type: "text",
                  text: "No organization found with the provided domain.",
                },
              ],
            };
          }

          const summary = {
            name: org.name,
            domain: org.primary_domain,
            industry: org.industry,
            employees: org.estimated_num_employees,
            location: org.city && org.state ? `${org.city}, ${org.state}` : org.country,
            description: org.short_description,
            founded: org.founded_year,
            linkedin: org.linkedin_url,
            technologies: org.current_technologies?.slice(0, 10),
          };

          return {
            content: [
              {
                type: "text",
                text: `Organization Enrichment:\n\n` +
                      `${JSON.stringify(summary, null, 2)}\n\n` +
                      `Full data:\n${JSON.stringify(result, null, 2)}`,
              },
            ],
          };
        }

        case "apollo_search_organizations": {
          const validated = SearchOrganizationsSchema.parse(args);

          const params: any = {
            page: validated.page,
            per_page: validated.per_page,
          };

          if (validated.keywords) params.q_keywords = validated.keywords;
          if (validated.locations) params.organization_locations = validated.locations;
          if (validated.employee_ranges) params.organization_num_employees_ranges = validated.employee_ranges;

          const result = await client.searchOrganizations(params);

          const orgs = result.organizations || [];
          const summary = orgs.slice(0, 5).map((o: any) => ({
            name: o.name,
            domain: o.primary_domain,
            industry: o.industry,
            employees: o.estimated_num_employees,
            location: o.city && o.state ? `${o.city}, ${o.state}` : o.country,
          }));

          return {
            content: [
              {
                type: "text",
                text: `Found ${result.pagination?.total_entries || 0} organizations\n\n` +
                      `Top Results:\n${JSON.stringify(summary, null, 2)}\n\n` +
                      `Full data:\n${JSON.stringify(result, null, 2)}`,
              },
            ],
          };
        }

        case "apollo_search_sequences": {
          const validated = SearchSequencesSchema.parse(args);

          const params: any = {
            page: validated.page,
            per_page: validated.per_page,
          };

          if (validated.name) params.name = validated.name;

          const result = await client.searchSequences(params);

          const sequences = result.emailer_campaigns || [];
          const summary = sequences.map((s: any) => ({
            id: s.id,
            name: s.name,
            active: s.active,
            num_steps: s.num_steps,
            stats: {
              sent: s.num_contacted_people,
              bounced: s.num_bounced_people,
              replied: s.num_replied_people,
              interested: s.num_interested_people,
              opt_out: s.num_opt_out_people,
            },
          }));

          return {
            content: [
              {
                type: "text",
                text: `Found ${sequences.length} sequences\n\n` +
                      `Summary:\n${JSON.stringify(summary, null, 2)}\n\n` +
                      `Full data:\n${JSON.stringify(result, null, 2)}`,
              },
            ],
          };
        }

        case "apollo_get_email_accounts": {
          const result = await client.getEmailAccounts();

          const accounts = result.email_accounts || [];
          const summary = accounts.map((a: any) => ({
            id: a.id,
            email: a.email,
            active: a.active,
            type: a.type,
          }));

          return {
            content: [
              {
                type: "text",
                text: `Found ${accounts.length} email accounts\n\n` +
                      `Accounts:\n${JSON.stringify(summary, null, 2)}\n\n` +
                      `Full data:\n${JSON.stringify(result, null, 2)}`,
              },
            ],
          };
        }

        case "apollo_get_email_message_activities": {
          const { message_id } = GetEmailMessageActivitiesSchema.parse(args);

          const result = await client.getEmailMessageActivities(message_id);

          const activities = result.emailer_touches || [];
          const summary = {
            message_id,
            total_activities: activities.length,
            opens: activities.filter((a: any) => a.touch_type === "opened").length,
            clicks: activities.filter((a: any) => a.touch_type === "clicked").length,
            replies: activities.filter((a: any) => a.touch_type === "replied").length,
            activities: activities.map((a: any) => ({
              type: a.touch_type,
              created_at: a.created_at,
              user_agent: a.user_agent,
            })),
          };

          return {
            content: [
              {
                type: "text",
                text: `Email Message Activities:\n\n` +
                      `${JSON.stringify(summary, null, 2)}\n\n` +
                      `Full data:\n${JSON.stringify(result, null, 2)}`,
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }

      if (error.response?.status === 401) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          "Invalid Apollo API key. Check your APOLLO_API_KEY environment variable."
        );
      }

      if (error.response?.status === 429) {
        throw new McpError(
          ErrorCode.InternalError,
          "Apollo API rate limit exceeded. Please wait and try again."
        );
      }

      throw new McpError(
        ErrorCode.InternalError,
        error.message || "An unexpected error occurred"
      );
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Apollo.io MCP server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
