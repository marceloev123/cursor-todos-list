import { supabaseClient } from "~/server/supabase-client/client";
import { type CreateTodoDto, type UpdateTodoDto } from "../dto/todo.dto";
import type { Database } from "database.types";

// For debugging, let's create a memory-based implementation
let memoryTodos: Database["public"]["Tables"]["todos"]["Row"][] = [
  {
    id: "1",
    name: "Sample Todo",
    description: "This is a sample todo from memory store",
    priority: "medium",
    status: "pending",
    story_points: 3,
    due_date: new Date().toISOString(),
    assignee_id: null,
    creator_id: "1",
    created_at: new Date().toISOString(),
    updated_at: null
  }
];

export const TodoService = {
  async find() {
    console.log("Finding all todos from memory...");
    
    // Try with Supabase first
    try {
      const result = await supabaseClient
        .from("todos")
        .select()
        .order("created_at", { ascending: false });
      
      console.log("Supabase todos result:", {
        data: result.data?.length ?? 0,
        error: result.error ? result.error.message : null
      });
      
      // If we have data from Supabase, use it
      if (result.data && result.data.length > 0) {
        return result.data as Database["public"]["Tables"]["todos"]["Row"][];
      }
    } catch (error) {
      console.error("Error fetching from Supabase:", error);
    }
    
    // Fallback to memory implementation
    console.log("Returning memory todos:", memoryTodos.length);
    return memoryTodos;
  },

  async findOne(id: string) {
    // Try Supabase first
    try {
      const result = await supabaseClient.from("todos").select().eq("id", id);
      if (result.data?.[0]) {
        return result.data[0] as Database["public"]["Tables"]["todos"]["Row"];
      }
    } catch (error) {
      console.error("Error fetching from Supabase:", error);
    }
    
    // Fallback to memory
    const todo = memoryTodos.find(t => t.id === id);
    return todo;
  },

  async create(todo: CreateTodoDto) {
    console.log("Creating todo:", todo);
    
    // Try with Supabase first
    try {
      const result = await supabaseClient.from("todos").insert(todo);
      console.log("Supabase create result:", {
        error: result.error ? result.error.message : null,
        status: result.status,
        statusText: result.statusText
      });
      
      if (!result.error) {
        // Now fetch the created item to get its ID
        const { data } = await supabaseClient
          .from("todos")
          .select()
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (data && data.length > 0) {
          // Add to memory store too for backup
          memoryTodos.unshift(data[0] as Database["public"]["Tables"]["todos"]["Row"]);
          console.log("Added new todo to memory store, count:", memoryTodos.length);
        }
        
        return result;
      }
    } catch (error) {
      console.error("Error creating in Supabase:", error);
    }
    
    // Create in memory as fallback
    const newTodo: Database["public"]["Tables"]["todos"]["Row"] = {
      id: String(Date.now()),
      name: todo.name,
      description: todo.description ?? null,
      priority: todo.priority,
      status: todo.status ?? "pending",
      story_points: todo.story_points ?? null,
      due_date: todo.due_date ?? null,
      assignee_id: todo.assignee_id ?? null,
      creator_id: todo.creator_id,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    memoryTodos.unshift(newTodo);
    console.log("Added new todo to memory store only, count:", memoryTodos.length);
    
    return { data: [newTodo], count: 1, status: 201, statusText: "Created" };
  },

  async update(id: string, todo: UpdateTodoDto) {
    // Try Supabase first
    try {
      const result = await supabaseClient.from("todos").update(todo).match({ id });
      if (!result.error) {
        // Update memory store too
        memoryTodos = memoryTodos.map(t => 
          t.id === id ? { ...t, ...todo, updated_at: new Date().toISOString() } : t
        );
        console.log("Updated todo in memory store");
        return result;
      }
    } catch (error) {
      console.error("Error updating in Supabase:", error);
    }
    
    // Update in memory
    memoryTodos = memoryTodos.map(t => 
      t.id === id ? { ...t, ...todo, updated_at: new Date().toISOString() } : t
    );
    
    return { 
      data: [memoryTodos.find(t => t.id === id)], 
      count: 1, 
      status: 200, 
      statusText: "OK" 
    };
  },

  async delete(id: string) {
    // Try Supabase first
    try {
      const result = await supabaseClient.from("todos").delete().match({ id });
      if (!result.error) {
        // Remove from memory too
        memoryTodos = memoryTodos.filter(t => t.id !== id);
        console.log("Deleted todo from memory store");
        return result;
      }
    } catch (error) {
      console.error("Error deleting from Supabase:", error);
    }
    
    // Delete from memory
    memoryTodos = memoryTodos.filter(t => t.id !== id);
    
    return { 
      data: null, 
      count: 1, 
      status: 200, 
      statusText: "OK" 
    };
  },
};
