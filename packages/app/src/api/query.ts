import { graphql } from "@/api/graphql";

export const ContributionQuery = graphql(`
  query ContributionQuery($name: String!, $start: DateTime!, $end: DateTime!) {
    user(login: $name) {
      contributionsCollection(from: $start, to: $end) {
        contributionCalendar {
          colors
          totalContributions
          weeks {
            contributionDays {
              color
              contributionCount
              date
              weekday
            }
            firstDay
          }
        }
      }
    }
  }
`);

export const UserQuery = graphql(`
  query UserQuery {
      viewer {
        name
        login
        avatarUrl
      }
  }
`);

export const SearchUsersQuery = graphql(`
    query SearchUsers($query: String!) {
        search(query: $query, type: USER, first: 10) {
            nodes {
                ... on User {
                    login
                    avatarUrl
                }
            }
        }
    }
`);
