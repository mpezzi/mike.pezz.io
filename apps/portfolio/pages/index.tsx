import { Button } from "ui";
import { getProjects } from "../lib/api";

interface PortfolioProps {
  data: any;
}

export default function Portfolio({ data }: PortfolioProps) {
  return (
    <div>
      <h1>Portfolio</h1>
      <ul>
        {data.data.map((project: any) => (
          <li key={project.id}>
            {project.attributes.Title}
          </li>
        ))}
      </ul>
      <Button />
    </div>
  );
}

export async function getStaticProps(context: any) {
  const { data } = await getProjects();
  return {
    props: {
      data,
    },
  }
}
