# @louis030195/apollo-io-mcp

MCP (Model Context Protocol) server for Apollo.io B2B sales intelligence API. Search for prospects, enrich contacts, and discover companies directly from Claude, ChatGPT, or any LLM that supports MCP.

## Features

- 🔍 **People Search** - Find prospects by job title, location, company
- 👤 **People Enrichment** - Enrich contact data with emails, phone numbers, LinkedIn profiles
- 🏢 **Organization Enrichment** - Get detailed company information
- 🌍 **Organization Search** - Discover companies by industry, size, location
- 📊 **B2B Intelligence** - Access Apollo's database of 275M+ contacts

## Installation

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "apollo-io": {
      "command": "npx",
      "args": ["-y", "@louis030195/apollo-io-mcp"],
      "env": {
        "APOLLO_API_KEY": "your-apollo-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
# Install globally in user scope with API key
claude mcp add -s user apollo-io npx -e APOLLO_API_KEY=your-apollo-api-key -- -y @louis030195/apollo-io-mcp
```

## Get Your Apollo.io API Key

1. Go to [Apollo.io](https://app.apollo.io/#/settings/integrations/api)
2. Sign up or log in
3. Navigate to Settings → Integrations → API
4. Copy your API key

## Usage

Once configured, you can use natural language to interact with Apollo.io:

### People Search
- "Find CTOs in San Francisco working at Series A startups"
- "Search for product managers in New York"
- "Who are the engineers at Anthropic?"

### People Enrichment
- "Enrich this email: john@example.com"
- "Find contact info for John Smith at Apollo.io"
- "Get details about jane.doe@company.com"

### Organization Search
- "Find SaaS companies in San Francisco with 50-200 employees"
- "Search for AI companies in the Bay Area"
- "List fintech startups in London"

### Organization Enrichment
- "Tell me about apollo.io"
- "Get company info for anthropic.com"
- "What technologies does stripe.com use?"

## Tools

### `apollo_search_people`

Search for people/prospects in Apollo's B2B database.

**Parameters:**
- `keywords` (string, optional): Keywords to search for (job title, company, etc)
- `titles` (array, optional): Job titles to filter by
- `locations` (array, optional): Locations to filter by
- `organization_ids` (array, optional): Organization IDs to filter by
- `page` (number, optional): Page number for pagination (default: 1)
- `per_page` (number, optional): Results per page, max 100 (default: 10)

**Returns:** List of people with contact info, job titles, companies, etc.

### `apollo_enrich_person`

Enrich a person's data with Apollo's B2B intelligence.

**Parameters:**
- `first_name` (string, optional): Person's first name
- `last_name` (string, optional): Person's last name
- `email` (string, optional): Person's email address
- `domain` (string, optional): Company domain
- `organization_name` (string, optional): Company name

**Returns:** Detailed person data including email, phone, LinkedIn, job info, etc.

### `apollo_enrich_organization`

Enrich a company's data with Apollo's B2B intelligence.

**Parameters:**
- `domain` (string, required): Company domain (e.g., apollo.io)

**Returns:** Detailed company data including size, industry, technologies, funding, etc.

### `apollo_search_organizations`

Search for companies/organizations in Apollo's B2B database.

**Parameters:**
- `keywords` (string, optional): Keywords to search for
- `locations` (array, optional): Locations to filter by
- `employee_ranges` (array, optional): Employee count ranges (e.g., ['1-10', '11-50'])
- `page` (number, optional): Page number for pagination (default: 1)
- `per_page` (number, optional): Results per page, max 100 (default: 10)

**Returns:** List of organizations with company info, size, location, etc.

## Development

```bash
# Clone the repo
git clone https://github.com/louis030195/apollo-io-mcp.git
cd apollo-io-mcp

# Install dependencies
npm install

# Build
npm run build

# Run locally
APOLLO_API_KEY=your-api-key npm start
```

## API Documentation

See [Apollo.io API Docs](https://docs.apollo.io/) for full API details.

## License

MIT

## Author

[Louis Beaumont](https://twitter.com/louis030195)
